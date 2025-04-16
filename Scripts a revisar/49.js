var moduleExport = false
if (typeof window === 'undefined') {
  var window = {}
  moduleExport = true
}

window.__ENV__ = {
  analyticsCATEX: 'G-H4STJ5CQF0',
  analyticsSOD: 'G-RMXVQJKLWM',
  appId: '529CV9H7MW',
  bannersJsonPath: 'json/banners.json',
  bannersPath: 'banners',
  baseURLbff: 'https://apps.lider.cl/',
  campaignConfig: 'json/campaignConfig.json',
  categoryPageConfig: 'json/categoryPageConfig.json',
  countDownBanner: 'json/countDownBanner.json',
  googleMapAccessCode: 'AIzaSyClqXpjadwRFQiWookJrZc_26PAdBuNIW8',
  homeCampaignIdFilter: 'blackcyber',
  homePageConfig: 'json/homePageConfig.json',
  imagesPath: 'images',
  indexName: 'campaigns_production',
  isCookieSecure: true,
  isEnabledHurricaneAddresses: true,
  isGTP: true,
  isSOD: true,
  isWalstore: '',
  liderGrocery: 'https://www.lider.cl/supermercado/',
  logger: true,
  loginEndpoint: 'login',
  loginEndpointV2: 'auth/login',
  newBff: true,
  newPasswordRecoveryUrl: '/rc-info-validacion',
  newRegisterUrl: '/signup',
  okToShopBaseUrl: 'https://api.okto.shop/snippet_v1/',
  onesignalId: 'd9d35189-d761-4e3f-824d-c9219e789c97',
  productPageConfig: 'json/productPageConfig.json',
  reCaptchaValidationCode: '6LdUhR0TAAAAAImvlxALX9Lgi-hsx3Hi_O8LMgh_',
  reCaptchaEnterpriseValidationCode: '6LfiFO8jAAAAALv24A6eRlm5xbNWb4_kazmeELW4',
  ridiculouslyLowPrice: 'json/ridiculouslyLowPrice.json',
  s2sStoresUrl: 'https://apps.lider.cl/catalogo/checkout',
  searchWithoutResultToCategory: 'json/searchWithoutResultToCategory.json',
  siteToStoreValueAmount: 19990,
  ssrEnabled: true,
  ssttJsonPath: 'json/sstt.json',
  storageBaseUrl: 'https://apps.lider.cl/landing',
  storageBaseUrlSOD: 'https://apps.lider.cl/landing-sod',
  supermarketItemsJsonPath: 'json/supermarketItems.json',
  tagManagerCatex: 'GTM-TZWFDQM',
  tagManagerGlobal: 'GTM-MP354DD',
  tagManagerId: 'GTM-TZWFDQM',
  tagManagerPuntoDeCompra: 'GTM-NVP6P55',
  tagManagerSod: 'GTM-NGXDCZ8',
  targetServices: 'gtp',
  timeout: 60000,
  checkoutBffTimeout: 80000,
  loginUrl: 'auth/login',
  passwordRecoveryUrl: '/rc-info-validacion',
  registerUrl: '/signup',
  whatsAppSelfServiceLink: 'https://wa.me/56957211492?text=Hola,%20tengo%20una%20consulta',
  seoHost: 'https://www.lider.cl',
  completeAccountEvaluation: 1,
  completeAccountDummyList: 'Cliente, Registrado, Cliente Registrado, Lider.cl, LiderCL',
  feedbackallyIntellectualProperty: 'https://feedbackally.walmart.com/survey/2w6XX1xqZcepzgF/',
  enableHomeReplenishment: true,
  enableCallProductCatalogForHR: true,
  enableMostPurchased: true,
  enableRedirectsToGlass: true,
}

if (window.__ENV__.targetServices === 'gtp') {
  const targetServicesUrls =
    'https://apps.lider.cl/landing,https://apps.lider.cl/,https://apps.lider.cl/landing-sod'.split(
      ','
    )
  window.__ENV__ = {
    ...window.__ENV__,
    targetServicesUrls,
    storageBaseUrl: targetServicesUrls[0],
    storageBaseUrlSOD: targetServicesUrls[2],
    isGTP: true,
  }
}

if (moduleExport) {
  module.exports = window
}
