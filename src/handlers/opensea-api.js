import { isHexString } from '@ethersproject/bytes';
import { OPENSEA_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import logger from 'logger';
import { fromWei, handleSignificantDecimals } from '@rainbow-me/utilities';
import { useAddressToENS } from '@rainbow-me/hooks';
import { abbreviations } from '../utils';
import { ENS_NFT_CONTRACT_ADDRESS } from '../references';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const apiGetAccountUniqueTokens = async (network, address, page) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/assets`;
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      params: {
        limit: UNIQUE_TOKENS_LIMIT_PER_PAGE,
        offset: offset,
        owner: address,
      },
      timeout: 20000, // 20 secs
    });
    return parseAccountUniqueTokens(data);
  } catch (error) {
    logger.log('Error getting unique tokens', error);
    throw error;
  }
};

export const apiGetUniqueTokenFloorPrice = async (
  network,
  urlSuffixForAsset
) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/asset/${urlSuffixForAsset}`;
    const EthSuffix = ' ETH';
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 5000, // 5 secs
    });
    if (JSON.stringify(data.data.collection.stats.floor_price) === '0') {
      return 'None';
    }
    const formattedFloorPrice =
      JSON.stringify(data.data.collection.stats.floor_price) + EthSuffix;
    return formattedFloorPrice;
  } catch (error) {
    throw error;
  }
};

export const apiGetTokenHistory = async (
  contractAddress,
  tokenID,
  accountAddress
) => {
  try {
    const checkFungibility = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=1`;

    const fungData = await rainbowFetch(checkFungibility, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    });

    let semiFungible = false;
    if (
      fungData.data.asset_events[0].asset.asset_contract.asset_contract_type ===
      'semi-fungible'
    ) {
      semiFungible = true;
    }

    let url = semiFungible
      ? `https://api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=299`
      : `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=299`;

    logger.log(url);

    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    });

    let array = data.data.asset_events;

    let tempResponse = array;

    if (array.length === 299) {
      let offset = 299;
      while (tempResponse.length !== 0) {
        let urlPage = semiFungible
          ? `https://api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`
          : `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`;

        let nextPage = await rainbowFetch(urlPage, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': OPENSEA_API_KEY,
          },
          method: 'get',
          timeout: 10000, // 10 secs
        });

        tempResponse = nextPage.data.asset_events;
        array = array.concat(tempResponse);
        offset = array.length + 1;
      }
    }

    const result = await filterAndMapData(contractAddress, array);

    return result;
  } catch (error) {
    logger.debug('FETCH ERROR:', error);
    throw error;
  }
};

async function GetAddress(address) {
  const addy = await useAddressToENS(address);

  if (isHexString(addy)) {
    const abbrevAddy = abbreviations.address(addy, 2);
    return abbrevAddy;
  }
  const abbrevENS = abbreviations.formatAddressForDisplay(addy);

  return abbrevENS;
}

const filterAndMapData = async (contractAddress, array) => {
  return Promise.all(
    array
      .filter(function (event) {
        let event_type = event.event_type;
        if (
          event_type === 'created' ||
          event_type === 'transfer' ||
          event_type === 'successful' ||
          event_type === 'cancelled'
        ) {
          return true;
        }
        return false;
      })
      .map(async function (event) {
        let event_type = event.event_type;
        let eventObject;
        let created_date = event.created_date;
        let from_account = '0x123';
        let to_account = '0x123';
        let sale_amount = '0';
        let list_amount = '0';
        let to_account_eth_address = 'x';

        switch (event_type) {
          case 'created':
            // eslint-disable-next-line no-case-declarations
            let tempList = fromWei(parseInt(event.starting_price));
            list_amount = handleSignificantDecimals(tempList, 5);

            eventObject = {
              created_date,
              event_type,
              from_account,
              list_amount,
              sale_amount,
              to_account,
              to_account_eth_address,
            };
            break;

          case 'transfer':
            await GetAddress(event.to_account.address).then(address => {
              let fro_acc = event.from_account.address;
              if (
                contractAddress === ENS_NFT_CONTRACT_ADDRESS &&
                fro_acc === '0x0000000000000000000000000000000000000000'
              ) {
                eventObject = {
                  created_date,
                  event_type: 'ens-registration',
                  from_account: '0x123',
                  list_amount,
                  sale_amount,
                  to_account: address,
                  to_account_eth_address: event.to_account.address,
                };
              } else if (
                contractAddress !== ENS_NFT_CONTRACT_ADDRESS &&
                fro_acc === '0x0000000000000000000000000000000000000000'
              ) {
                eventObject = {
                  created_date,
                  event_type: 'mint',
                  from_account: '0x123',
                  list_amount,
                  sale_amount,
                  to_account: address,
                  to_account_eth_address: event.to_account.address,
                };
              } else {
                eventObject = {
                  created_date,
                  event_type,
                  from_account: fro_acc,
                  list_amount,
                  sale_amount,
                  to_account: address,
                  to_account_eth_address: event.to_account.address,
                };
              }
            });
            break;

          case 'successful':
            // eslint-disable-next-line no-case-declarations
            let tempSale = fromWei(parseInt(event.total_price));
            sale_amount = handleSignificantDecimals(tempSale, 5);

            eventObject = {
              created_date,
              event_type,
              from_account,
              list_amount,
              sale_amount,
              to_account,
              to_account_eth_address,
            };
            break;

          case 'cancelled':
            eventObject = {
              created_date,
              event_type,
              from_account,
              list_amount,
              sale_amount,
              to_account,
              to_account_eth_address,
            };
            break;

          default:
            logger.log('default');
            break;
        }
        // logger.log(eventObject);
        return eventObject;
      })
  );
};
