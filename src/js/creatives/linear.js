import FW from '../framework/fw';
import ENV from '../framework/env';
import Utils from '../framework/utils';
import TRACKING_EVENTS from '../tracking/tracking-events';
import VAST_PLAYER from '../players/vast-player';
import VPAID from '../players/vpaid';
import ICONS from './icons';
import RmpConnection from '../../assets/rmp-connection/rmp-connection';
import SimidPlayer from '../players/simid/simid_player';

const LINEAR = {};

const VPAID_PATTERN = /vpaid/i;
const JS_PATTERN = /\/javascript/i;
const HTML5_MEDIA_ERROR_TYPES = [
  'MEDIA_ERR_CUSTOM',
  'MEDIA_ERR_ABORTED',
  'MEDIA_ERR_NETWORK',
  'MEDIA_ERR_DECODE',
  'MEDIA_ERR_SRC_NOT_SUPPORTED',
  'MEDIA_ERR_ENCRYPTED'
];
const COMMON_VIDEO_FORMATS = [
  'video/webm',
  'video/mp4',
  'video/ogg',
  'video/3gpp'
];

const _onDurationChange = function () {
  this.vastPlayerDuration = VAST_PLAYER.getDuration.call(this);
  Utils.createApiEvent.call(this, 'addurationchange');
  // progress event
  if (this.vastPlayerDuration === -1) {
    return;
  }
  const keys = Object.keys(this.creative.trackingEvents);
  keys.forEach((eventName) => {
    if (/progress-/i.test(eventName)) {
      const time = eventName.split('-');
      const time_2 = time[1];
      if (/%/i.test(time_2)) {
        let timePerCent = time_2.slice(0, -1);
        timePerCent = (this.vastPlayerDuration * parseFloat(timePerCent)) / 100;
        const trackingUrls = this.creative.trackingEvents[eventName];
        trackingUrls.forEach(url => {
          this.progressEvents.push({
            time: timePerCent,
            url: url
          });
        });
      } else {
        const trackingUrls = this.creative.trackingEvents[eventName];
        trackingUrls.forEach(url => {
          this.progressEvents.push({
            time: parseFloat(time_2) * 1000,
            url: url
          });
        });
      }
    }
  });
  // sort progress time ascending
  if (this.progressEvents.length > 0) {
    this.progressEvents.sort(function (a, b) {
      return a.time - b.time;
    });
  }
};

const _onLoadedmetadataPlay = function () {
  clearTimeout(this.creativeLoadTimeoutCallback);
  // adjust volume to make sure content player volume matches vast player volume
  if (this.vastPlayer) {
    if (this.vastPlayer.volume !== this.contentPlayer.volume) {
      this.vastPlayer.volume = this.contentPlayer.volume;
    }
    if (this.contentPlayer.muted) {
      this.vastPlayer.muted = true;
    } else {
      this.vastPlayer.muted = false;
    }
  }
  // show ad container holding vast player
  FW.show(this.adContainer);
  FW.show(this.vastPlayer);
  this.adOnStage = true;
  // play VAST player
  VAST_PLAYER.play.call(this, this.firstVastPlayerPlayRequest);
  if (this.firstVastPlayerPlayRequest) {
    this.firstVastPlayerPlayRequest = false;
  }
  Utils.createApiEvent.call(this, 'adloaded');
  TRACKING_EVENTS.dispatch.call(this, 'loaded');
};

const _onClickThrough = function (event) {
  if (event) {
    event.stopPropagation();
  }
  if (!ENV.isMobile) {

    console.log(
      `${FW.consolePrepend} Opening clickthrough URL at ${this.creative.clickThroughUrl}`,
      FW.consoleStyle,
      ''
    );

    FW.openWindow(this.creative.clickThroughUrl);
  }
  this.pause();
  Utils.createApiEvent.call(this, 'adclick');
  TRACKING_EVENTS.dispatch.call(this, 'clickthrough');
};

const _onPlaybackError = function (event) {
  // https://www.w3.org/TR/html50/embedded-content-0.html#mediaerror
  // MEDIA_ERR_SRC_NOT_SUPPORTED is sign of fatal error
  // other errors may produce non-fatal error in the browser so we do not 
  // act upon them
  if (event && event.target) {
    const videoElement = event.target;
    if (videoElement.error && FW.isNumber(videoElement.error.code)) {
      const errorCode = videoElement.error.code;
      let errorMessage = '';
      if (typeof videoElement.error.message === 'string') {
        errorMessage = videoElement.error.message;
      }

      console.log(
        `${FW.consolePrepend} Error on video element with code ${errorCode.toString()} and message ${errorMessage}`,
        FW.consoleStyle,
        ''
      );
      console.log(
        `${FW.consolePrepend} error type is ${HTML5_MEDIA_ERROR_TYPES[errorCode] ? HTML5_MEDIA_ERROR_TYPES[errorCode] : 'unknown type'}`,
        FW.consoleStyle,
        ''
      );

      // EDIA_ERR_SRC_NOT_SUPPORTED (numeric value 4)
      if (errorCode === 4) {
        Utils.processVastErrors.call(this, 401, true);
      }
    }
  }
};

const _appendClickUIOnMobile = function () {
  // we create a <a> tag rather than using window.open 
  // because it works better in standalone mode and WebView
  this.clickUIOnMobile = document.createElement('a');
  this.clickUIOnMobile.className = 'rmp-ad-click-ui-mobile';
  this.clickUIOnMobile.textContent = this.params.labels.textForClickUIOnMobile;
  this.clickUIOnMobile.addEventListener('touchend', this.onClickThrough);
  this.clickUIOnMobile.href = this.creative.clickThroughUrl;
  this.clickUIOnMobile.target = '_blank';
  this.adContainer.appendChild(this.clickUIOnMobile);
};

const _onContextMenu = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
};

const _setCanBeSkippedUI = function () {
  FW.setStyle(this.skipWaiting, { display: 'none' });
  FW.setStyle(this.skipMessage, { display: 'block' });
  FW.setStyle(this.skipIcon, { display: 'block' });
};

const _updateWaitingForCanBeSkippedUI = function (delta) {
  if (Math.round(delta) > 0) {
    this.skipWaiting.textContent = this.params.labels.skipMessage + ' ' + Math.round(delta) + 's';
  }
};

const _onTimeupdateCheckSkip = function () {
  if (this.skipButton.style.display === 'none') {
    FW.setStyle(this.skipButton, { display: 'block' });
  }
  this.vastPlayerCurrentTime = this.vastPlayer.currentTime;
  if (FW.isNumber(this.vastPlayerCurrentTime) && this.vastPlayerCurrentTime > 0) {
    if (this.vastPlayerCurrentTime >= this.creative.skipoffset) {
      this.vastPlayer.removeEventListener('timeupdate', this.onTimeupdateCheckSkip);
      _setCanBeSkippedUI.call(this);
      this.skippableAdCanBeSkipped = true;
      Utils.createApiEvent.call(this, 'adskippablestatechanged');
    } else if (this.creative.skipoffset - this.vastPlayerCurrentTime > 0) {
      _updateWaitingForCanBeSkippedUI.call(this, this.creative.skipoffset - this.vastPlayerCurrentTime);
    }
  }
};

const _onClickSkip = function (event) {
  if (event) {
    event.stopPropagation();
    if (event.type === 'touchend') {
      event.preventDefault();
    }
  }
  if (this.skippableAdCanBeSkipped) {
    // create API event 
    Utils.createApiEvent.call(this, 'adskipped');
    // request ping for skip event
    TRACKING_EVENTS.dispatch.call(this, 'skip');
    // resume content
    VAST_PLAYER.resumeContent.call(this);
  }
};

const _appendSkip = function () {
  this.skipButton = document.createElement('div');
  this.skipButton.className = 'rmp-ad-container-skip';
  FW.setStyle(this.skipButton, { display: 'none' });
  Utils.makeButtonAccessible(this.skipButton, this.params.labels.skipMessage);

  this.skipWaiting = document.createElement('div');
  this.skipWaiting.className = 'rmp-ad-container-skip-waiting';
  _updateWaitingForCanBeSkippedUI.call(this, this.creative.skipoffset);
  FW.setStyle(this.skipWaiting, { display: 'block' });

  this.skipMessage = document.createElement('div');
  this.skipMessage.className = 'rmp-ad-container-skip-message';
  this.skipMessage.textContent = this.params.labels.skipMessage;
  FW.setStyle(this.skipMessage, { display: 'none' });

  this.skipIcon = document.createElement('div');
  this.skipIcon.className = 'rmp-ad-container-skip-icon';
  FW.setStyle(this.skipIcon, { display: 'none' });

  this.onClickSkip = _onClickSkip.bind(this);
  this.skipButton.addEventListener('click', this.onClickSkip);
  this.skipButton.addEventListener('touchend', this.onClickSkip);
  this.skipButton.appendChild(this.skipWaiting);
  this.skipButton.appendChild(this.skipMessage);
  this.skipButton.appendChild(this.skipIcon);
  this.adContainer.appendChild(this.skipButton);
  this.onTimeupdateCheckSkip = _onTimeupdateCheckSkip.bind(this);
  this.vastPlayer.addEventListener('timeupdate', this.onTimeupdateCheckSkip);
};

const _onHlsJSError = function (event, data) {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        // try to recover network error
        this.hlsJS[this.hlsJSIndex].startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        this.hlsJS[this.hlsJSIndex].recoverMediaError();
        break;
      default:
        Utils.processVastErrors.call(this, 900, true);
        break;
    }
  }
};

LINEAR.update = function (url, type) {
  console.log(
    `${FW.consolePrepend} update vast player for linear creative of type ${type} located at ${url}`,
    FW.consoleStyle,
    ''
  );

  this.onDurationChange = _onDurationChange.bind(this);
  this.vastPlayer.addEventListener('durationchange', this.onDurationChange, { once: true });

  // when creative is loaded play it 
  this.onLoadedmetadataPlay = _onLoadedmetadataPlay.bind(this);
  this.vastPlayer.addEventListener('loadedmetadata', this.onLoadedmetadataPlay, { once: true });

  // prevent built in menu to show on right click
  this.onContextMenu = _onContextMenu.bind(this);
  this.vastPlayer.addEventListener('contextmenu', this.onContextMenu);

  this.onPlaybackError = _onPlaybackError.bind(this);

  // start creativeLoadTimeout
  this.creativeLoadTimeoutCallback = setTimeout(() => {
    Utils.processVastErrors.call(this, 402, true);
  }, this.params.creativeLoadTimeout);
  // load ad asset
  if (this.useContentPlayerForAds) {
    this.contentPlayer.addEventListener('error', this.onPlaybackError);
    this.contentPlayer.src = url;
  } else {
    if (this.params.useHlsJS && type === 'application/vnd.apple.mpegurl' && typeof window.Hls !== 'undefined' &&
      Hls.isSupported()) {
      this.readingHlsJS = true;
      const hlsJSConfig = {
        autoStartLoad: true,
        debug: this.params.debugHlsJS,
        capLevelToPlayerSize: true,
        testBandwidth: true,
        progressive: false,
        lowLatencyMode: false,
        enableWebVTT: false,
        enableIMSC1: false,
        enableCEA708Captions: false
      };
      this.hlsJS[this.hlsJSIndex] = new Hls(hlsJSConfig);
      this.hlsJS[this.hlsJSIndex].on(Hls.Events.ERROR, _onHlsJSError.bind(this));
      this.hlsJS[this.hlsJSIndex].loadSource(url);
      this.hlsJS[this.hlsJSIndex].attachMedia(this.vastPlayer);
    } else {
      if (typeof this.creative.simid === 'undefined' || (this.creative.simid && !this.params.enableSimid)) {
        this.vastPlayer.addEventListener('error', this.onPlaybackError);
        this.vastPlayer.src = url;
        // we need this extra load for Chrome data saver mode in mobile or desktop
        this.vastPlayer.load();
      } else {
        if (this.simidPlayer) {
          this.simidPlayer.stopAd();
        }
        this.simidPlayer = new SimidPlayer(
          this.creative.isLinear,
          this.creative.simid,
          url,
          this.creative.adId,
          this.creative.id,
          this.ad.adServingId,
          this.creative.clickThroughUrl,
          this
        );
        this.simidPlayer.initializeAd();
        this.simidPlayer.playAd();
      }
    }
  }

  // clickthrough interaction
  this.onClickThrough = _onClickThrough.bind(this);
  if (this.creative.clickThroughUrl) {
    if (ENV.isMobile) {
      _appendClickUIOnMobile.call(this);
    } else {
      this.vastPlayer.addEventListener('click', this.onClickThrough);
    }
  }

  // skippable - only where vast player is different from 
  // content player
  if (this.creative.isSkippableAd) {
    _appendSkip.call(this);
  }
};

LINEAR.parse = function (icons, adParameters, mediaFiles) {
  if (icons.length > 0) {
    ICONS.parse.call(this, icons);
  }
  // check for AdParameters tag in case we have a VPAID creative
  this.adParametersData = '';
  if (adParameters !== null) {
    this.adParametersData = adParameters;
  }
  let mediaFileItems = [];
  for (let i = 0; i < mediaFiles.length; i++) {
    const currentMediaFile = mediaFiles[i];
    const mediaFileValue = currentMediaFile.fileURL;
    const type = currentMediaFile.mimeType;
    if (mediaFileValue === null || type === null) {
      continue;
    }
    const newMediaFileItem = {};
    newMediaFileItem.url = mediaFileValue;
    newMediaFileItem.type = type;
    if (currentMediaFile.codec !== null) {
      newMediaFileItem.codec = currentMediaFile.codec;
    }
    // check for potential VPAID - we have a VPAID JS - we break
    // for VPAID we may not have a width, height or delivery
    if (this.params.enableVpaid && currentMediaFile.apiFramework &&
      VPAID_PATTERN.test(currentMediaFile.apiFramework) && JS_PATTERN.test(type)) {

      console.log(`${FW.consolePrepend} VPAID creative detected`, FW.consoleStyle, '');

      mediaFileItems = [newMediaFileItem];
      this.isVPAID = true;
      break;
    }
    newMediaFileItem.width = currentMediaFile.width;
    newMediaFileItem.height = currentMediaFile.height;
    newMediaFileItem.bitrate = currentMediaFile.bitrate;
    mediaFileItems.push(newMediaFileItem);
  }
  // we support HLS; MP4; WebM: VPAID so let us fecth for those
  const creatives = [];
  for (let j = 0; j < mediaFileItems.length; j++) {
    const currentMediaFileItem = mediaFileItems[j];
    const type = currentMediaFileItem.type;
    const url = currentMediaFileItem.url;
    if (this.isVPAID && url) {
      VPAID.loadCreative.call(this, url, this.params.vpaidSettings);
      this.creative.type = type;
      return;
    }
    // we have HLS > use hls.js where no native support for HLS is available or native HLS otherwise (Apple devices mainly)
    if (type === 'application/vnd.apple.mpegurl' &&
      (ENV.checkCanPlayType(type) ||
        (typeof window.Hls !== 'undefined' && Hls.isSupported()))) {
      VAST_PLAYER.append.call(this, url, type);
      this.creative.type = type;
      return;
    }
    // we have DASH and DASH is natively supported > use DASH
    if (ENV.checkCanPlayType('application/dash+xml')) {
      VAST_PLAYER.append.call(this, url, type);
      this.creative.type = type;
      return;
    }
    // we gather MP4, WebM, OGG and remaining files
    creatives.push(currentMediaFileItem);
  }
  let retainedCreatives = [];
  // first we check for the common formats below ... 
  const __filterCommonCreatives = function (i, creative) {
    if (creative.codec && creative.type === COMMON_VIDEO_FORMATS[i]) {
      return ENV.checkCanPlayType(creative.type, creative.codec);
    } else if (creative.type === COMMON_VIDEO_FORMATS[i]) {
      return ENV.checkCanPlayType(creative.type);
    }
    return false;
  };
  for (let k = 0; k < COMMON_VIDEO_FORMATS.length; k++) {
    retainedCreatives = creatives.filter(__filterCommonCreatives.bind(null, k));
    if (retainedCreatives.length > 0) {
      break;
    }
  }
  // ... if none of the common format work, then we check for exotic format
  // first we check for those with codec information as it provides more accurate support indication ...
  if (retainedCreatives.length === 0) {
    const __filterCodecCreatives = function (codec, type, creative) {
      return creative.codec === codec && creative.type === type;
    };
    creatives.forEach(creative => {
      if (creative.codec && creative.type && ENV.checkCanPlayType(creative.type, creative.codec)) {
        retainedCreatives = creatives.filter(__filterCodecCreatives.bind(null, creative.codec, creative.type));
      }
    });
  }
  // ... if codec information are not available then we go first type matching
  if (retainedCreatives.length === 0) {
    const __filterTypeCreatives = function (type, creative) {
      return creative.type === type;
    };
    creatives.forEach(creative => {
      if (creative.type && ENV.checkCanPlayType(creative.type)) {
        retainedCreatives = creatives.filter(__filterTypeCreatives.bind(null, creative.type));
      }
    });
  }

  // still no match for supported format - we exit
  if (retainedCreatives.length === 0) {
    // None of the MediaFile provided are supported by the player
    Utils.processVastErrors.call(this, 403, true);
    return;
  }

  // sort supported creatives by width
  retainedCreatives.sort((a, b) => {
    return a.width - b.width;
  });

  console.log(`${FW.consolePrepend} available linear creative follows`, FW.consoleStyle, '');
  console.log(retainedCreatives);

  // we have files matching device capabilities
  // select the best one based on player current width
  let finalCreative;
  let validCreativesByWidth = [];
  let validCreativesByBitrate = [];
  if (retainedCreatives.length > 1) {
    const containerWidth = FW.getWidth(this.container) * ENV.devicePixelRatio;
    const containerHeight = FW.getHeight(this.container) * ENV.devicePixelRatio;
    if (containerWidth > 0 && containerHeight > 0) {
      validCreativesByWidth = retainedCreatives.filter((creative) => {
        return containerWidth >= creative.width && containerHeight >= creative.height;
      });
    }

    console.log(`${FW.consolePrepend} validCreativesByWidth follow`, FW.consoleStyle, '');
    console.log(validCreativesByWidth);

    // if no match by size 
    if (validCreativesByWidth.length === 0) {
      validCreativesByWidth = [retainedCreatives[0]];
    }

    // filter by bitrate to provide best quality
    const rmpConnection = new RmpConnection();
    let availableBandwidth = rmpConnection.bandwidthData.estimate;

    console.log(`${FW.consolePrepend} availableBandwidth is ${availableBandwidth} Mbps`, FW.consoleStyle, '');

    if (availableBandwidth > -1 && validCreativesByWidth.length > 1) {
      // sort supported creatives by bitrates
      validCreativesByWidth.sort((a, b) => {
        return a.bitrate - b.bitrate;
      });
      // convert to kbps
      availableBandwidth = Math.round(availableBandwidth * 1000);
      validCreativesByBitrate = validCreativesByWidth.filter((creative) => {
        return availableBandwidth >= creative.bitrate;
      });

      console.log(`${FW.consolePrepend} validCreativesByBitrate follow`, FW.consoleStyle, '');
      console.log(validCreativesByBitrate);

      // pick max available bitrate
      finalCreative = validCreativesByBitrate[validCreativesByBitrate.length - 1];
    }
  }

  // if no match by bitrate 
  if (!finalCreative) {
    if (validCreativesByWidth.length > 0) {
      finalCreative = validCreativesByWidth[validCreativesByWidth.length - 1];
    } else {
      retainedCreatives.sort((a, b) => {
        return a.bitrate - b.bitrate;
      });
      finalCreative = retainedCreatives[retainedCreatives.length - 1];
    }
  }

  console.log(`${FW.consolePrepend} selected linear creative follows`, FW.consoleStyle, '');
  console.log(finalCreative);

  this.creative.mediaUrl = finalCreative.url;
  this.creative.height = finalCreative.height;
  this.creative.width = finalCreative.width;
  this.creative.type = finalCreative.type;
  VAST_PLAYER.append.call(this, finalCreative.url, finalCreative.type);
};

export default LINEAR;
