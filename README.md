# rmp-vast

A client-side JavaScript solution to load, parse, ping and display VAST resources (advertising).

It aims at implementing the [IAB VAST specification](https://iabtechlab.com/standards/vast/) for web-based environments - e.g. browser, WebView (Ionic, Flutter, Cordova, Electron ...) & smart TV - where both HTML5 video and JavaScript are available. We support VAST 3 and VAST 4 up to VAST 4.3. VAST 2 support has been deprecated with rmp-vast 15 and we no longer test for VAST 2 tags.

rmp-vast comes as a compiled library (./dist/ folder) but it can also be imported as a ES2015 module.

rmp-vast makes use of [vast-client-js](https://github.com/dailymotion/vast-client-js) for fetching and parsing VAST XML resources.

rmp-vast is used and maintained by [Radiant Media Player](https://www.radiantmediaplayer.com/).

## Documentation sections

- [Quick start guide](#quick-start-guide)
- [Supported VAST features](#supported-vast-features)
- [Supported environments](#supported-environments)
- [CORS requirements](#cors-requirements)
- [Video ads from Google Ads network and rmp-vast](#video-ads-from-google-ads-network-and-rmp-vast)
- [Debugging](#debugging)
- [Parameters, API events and methods](#parameters-api-events-and-methods)
- [Companion ads support](#companion-ads-support)
- [AdVerifications OM Web SDK](#adverifications-om-web-sdk)
- [SIMID support](#simid-support)
- [VPAID support (DEPRECATED)](#vpaid-support)
- [HLS creatives support](#hls-creatives-support)
- [Macros](#macros)
- [Autoplay support](#autoplay-support)
- [Fullscreen management](#fullscreen-management)
- [Pre, mid and post rolls](#pre-mid-and-post-rolls)
- [Outstream ads](#outstream-ads)
- [TypeScript support](#typescript-support)
- [Contributing](#contributing)
- [License](#license)
- [Radiant Media Player](#radiant-media-player)

## Quick start guide

First download latest rmp-vast package from the [release tab](https://github.com/radiantmediaplayer/rmp-vast/releases).

You must use rmp-vast in a well-formed HTML document. This means a web-page with a valid HTML5 DOCTYPE and other elements that are commonly available in today's web.

- Secondly we add rmp-vast library (./dist/rmp-vast.min.js) on our page - in &lt;head&gt; for example.

```html
<script src="./dist/rmp-vast.min.js">
```
OR
```js
import RmpVast from 'rmp-vast';
```

- Then we must adhere to a specific HTML layout pattern. This pattern is as follows:

```html
<div class="rmp-container" id="vast-player">
  <div class="rmp-content">
    <video
      class="rmp-video"
      src="https://www.rmp-streaming.com/media/big-buck-bunny-360p.mp4"
      playsinline
      muted
      controls
    ></video>
  </div>
</div>
```

Do NOT rename CSS classes or alter this HTML layout. The HTML5 video tag used for content must use the src property on the HTML5 video (e.g. do not use &lt;source&gt; tag).

- We need to explicitly set the size of div.rmp-container element, for example with CSS we could add to our page:
```html
<style>
  .rmp-container {
    width: 960px;
    height: 540px;
    margin: auto;
  }
</style>
```

- Init the library with JavaScript:

```javascript
// our VAST tag to be displayed
const adTag =
  "https://www.radiantmediaplayer.com/vast/tags/inline-linear-1.xml";
const id = "vast-player";
const params = {
  ajaxTimeout: 5000,
  maxNumRedirects: 10,
};
// create RmpVast instance
const rmpVast = new RmpVast(id, params);
// call loadAds - this will start the ad loading process, display the ad and resume content automatically
// in this case we use autoplay
rmpVast.loadAds(adTag);

// or if autoplay is not wanted the call to loadAds must be the result
// of a user interaction (click, touchend ...)
// playButton.addEventListener('click', function() {
//   rmpVast.loadAds(adTag);
// });
```

A complete implementation example is provided in app/index.html. You should look at app/js/app.js.
This example can be found live at https://www.radiantmediaplayer.com/rmp-vast/app/.

Alternatively, you may also create a RmpVast instance while passing a reference to the player container. This can come in handy for some web frameworks. Note that the element must be an instanceof HTMLElement.
```javascript
// We already have a reference to the player container (e.g. element with "rmp-container" class)
const element = this.element;
// create RmpVast instance
const rmpVast = new RmpVast(element, params);
```

- rmp-vast is written in ES2017 and compiled as a library with [Webpack](https://webpack.js.org/). See .browserslistrc for a list of targeted environments for the compiled library. If you want to use rmp-vast as a module (e.g. not using the compiled library), it is up to you to compile it in your project. Please refer to babel.config.js and webpack.dev.config.js for guidance.

[Back to documentation sections](#documentation-sections)

## Supported VAST features

We support VAST standard up to VAST 4.3, this includes:

- Inline and Wrapper Ads
- Linear Ads
- Skippable Linear Ads
- Linear creatives in MP4/WebM progressive download
- Linear creatives in HLS format on all supported devices (with hls.js where MSE is available or native HLS otherwise)
- Non Linear Ads (image/iframe/HTML)
- Companion Ads (image/iframe/HTML)
- Tracking Events (tracking URLs must return an image - typically a 1px GIF/PNG/JPG/AVIF)
- Error Reporting
- Industry Icons (image/iframe/HTML)
- VAST 4.3 Macros
- AdVerifications with OM Web SDK (support for Creative Access Mode e.g. full only)
- SIMID (Linear creative only)
- VPAID 1 and 2 JavaScript <sup>DEPRECATED</sup>
- Outstream ads
- Ad Pods
- Audio Ads (MP3/M4A/HLS where natively supported) in HTML5 video
- ViewableImpression, Universal Ad ID, AdServingId, Survey and Ad Categories

### Currently unsupported features

- VMAP

[Back to documentation sections](#documentation-sections)

## Supported environments

### rmp-vast compiled library (./dist/rmp-vast.min.js)

#### Browsers

- Latest Chrome for Android 6+
- Chrome 55+ for Desktop
- Latest Firefox for Android 6+
- Firefox 53+ for Desktop
- Opera 42+ for Desktop
- Samsung Internet 9.2+ for Android 6+
- Safari 12+ for Desktop
- Safari for iOS 12+ and iPadOS 13+
- MS Edge 79+ for Desktop
- MS Edge Legacy 15+ for Desktop

Desktop means Windows 7+, macOS 10.11+, Linux (latest LTS Ubuntu).

#### WebViews (Ionic, Flutter, Cordova, WebView created from native code)

- Android 6+
- iOS 12+ (WKWebView)

With the announcement of Apple in december 2019, to remove support for UIWebView API by end 2020, we only support WKWebView API for iOS apps built with Ionic, Flutter, Cordova or WebView created from native code. [See this blog post](https://www.radiantmediaplayer.com/blog/updating-ios-apps-for-wkwebview.html) to help you update to WKWebView API.

For Flutter apps we support using rmp-vast with [webview_flutter](https://pub.dev/packages/webview_flutter) plugin. See a guide for adding WebView to your [Flutter app here](https://codelabs.developers.google.com/codelabs/flutter-webview).

#### Smart TV & OTT (Native web, Cordova or WebView created from native code)

- Samsung Tizen 4+ apps
- LG webOS 4+ apps
- Electron 6+ apps
- Android TV 9+ apps with Cordova or WebView created from native code

[Back to documentation sections](#documentation-sections)

## CORS requirements

rmp-vast uses JavaScript XMLHttpRequests to load VAST tags. Hence proper [CORS configuration](https://enable-cors.org/) is required on your ad-server in order for rmp-vast to be able to retrieve VAST tags. Refer to this [Google documentation](https://developers.google.com/interactive-media-ads/docs/sdks/html5/cors) for more information.

[Back to documentation sections](#documentation-sections)

## Video ads from Google Ads network and rmp-vast

When serving ads from Google Ads network (DFP, ADX, AdSense for Video) we recommend using [Google IMA HTML5 SDK](https://developers.google.com/interactive-media-ads/docs/sdks/html5/). Radiant Media Player supports [Google IMA HTML5 SDK](https://www.radiantmediaplayer.com/docs/latest/video-ads-documentation.html) and is a certified [Google's video technology partner](https://support.google.com/admanager/answer/186110?hl=en). rmp-vast can display VAST ads from Google Ads network as well - though all features from Google Ads network may not be available.

[Back to documentation sections](#documentation-sections)

## Debugging

rmp-vast compiled library (./dist/rmp-vast.min.js) does not print any log to the console. If you want those logs for debugging purposes please use ./dist/rmp-vast.js instead

[Back to documentation sections](#debugging)

## Parameters, API events and methods

Source code for rmp-vast is available for review in ./src/ folder. Code comments should be available at key points to better understand rmp-vast inner workings.

### Parameters when creating a rmp-vast instance

Once rmp-vast is loaded on your page you can create a new rmp-vast instance as follows:

`new RmpVast(id: String, params: Object)`

- `idOrElement: String|HTMLElement` the id or element for the player container. This is a required parameter.
- `params: Object` is an optional object representing various parameters that can be passed to a rmp-vast instance and that will affect the player inner-workings. Available properties for the params object follow:
  - `params.ajaxTimeout: Number` timeout in ms for an AJAX request to load a VAST tag from the ad server. Default 5000.
  - `params.creativeLoadTimeout: Number` timeout in ms to load linear media creative from the server. Default 8000.
  - `params.ajaxWithCredentials: Boolean` AJAX request to load VAST tag from ad server should or should not be made with credentials. Default: false.
  - `params.maxNumRedirects: Number` the number of VAST wrappers the player should follow before triggering an error. Default: 4. Capped at 30 to avoid infinite wrapper loops.
  - `params.labels: Object` labels used to display information to the viewer.
  - `params.labels.skipMessage: String` skip message. Default: 'Skip ad'.
  - `params.labels.closeAd: String` close ad message. Default: 'Close ad'.
  - `params.labels.textForInteractionUIOnMobile: String` on mobile devices the click-through URL for a linear ad is provided in a box located at the top right corner of the player. This setting set the text for this box. Default: 'Learn more'.
  - `params.outstream: Boolean` Enables outstream ad mode. Default: false.
  - `params.showControlsForAdPlayer: Boolean` Shows ad player HTML5 default video controls. Default: false.
  - `params.vastXmlInput: Boolean` Instead of a VAST URI, we provide directly to rmp-vast VAST XML. Default: false. See test/spec/inlineLinearSpec/raw-xml-input.html for an example.
  - `params.enableSimid: Boolean` Enables SIMID support or not. Default: true.
  - `params.enableVpaid: Boolean` DEPRECATED. Enables VPAID support or not. Default: true.
  - `params.vpaidSettings: Object` DEPRECATED. Information required to properly display VPAID creatives - note that it is up to the parent application of rmp-vast to provide those information - below values are default (see test/spec/vpaidSpec/ for examples):
    - `params.vpaidSettings.width: Number` Default: 640.
    - `params.vpaidSettings.height: Number` Default: 360.
    - `params.vpaidSettings.viewMode: String` Default: 'normal'. Can be 'fullscreen' as well.
    - `params.vpaidSettings.desiredBitrate: Number` Default: 500. In kbps.
  - `params.useHlsJS: Boolean` Enables rendering of HLS creatives with hls.js in rmp-vast. Default: true.
  - `params.debugHlsJS: Boolean` Enables debugging of HLS creatives with hls.js in rmp-vast. Default: false.
  - `params.debugRawConsoleLogs: Boolean` Enables raw debug console log for Flutter apps and legacy platforms. Default: false.
  - `params.omidSupport: Boolean` Enables OMID (OM Web SDK) support in rmp-vast. Default: false. Refer to the [AdVerifications OM Web SDK](#adverifications-om-web-sdk) section for more information.
  - `params.omidAllowedVendors: Array` List of allowed vendors for ad verification. Vendors not listed will be rejected. Default: [].
  - `params.omidRunValidationScript: Boolean` Allows to run OM Web SDK inside rmp-vast to run against IAB [validation-verification-script](https://interactiveadvertisingbureau.github.io/Open-Measurement-SDKJS/validation.html). Default: false.
  - `params.omidAutoplay: Boolean` The content player will autoplay or not. The possibility of autoplay is not determined by rmp-vast, this information needs to be passed to rmp-vast ([see this script for example](https://github.com/video-dev/can-autoplay)). Default: false (means a click to play is required).
  - `params.macros: Map` values for Macros to be used by rmp-vast for ping URLs (for those not handled automatically by rmp-vast).
  - `params.partnerName: String` partnerName for OMID. Default: 'rmp-vast'.
  - `params.partnerVersion: String` partnerVersion for OMID. Default: latest rmp-vast version.

[Back to documentation sections](#documentation-sections)

### Starting the rmp-vast player

It is important for the rmp-vast instance to be properly initialized to avoid playback issues.

Playing video ads in HTML5 video is a non-trivial process that requires the overlaying of multiple video tags. On mobile devices a user interaction is required to properly initialized a video tag and various restrictions are set by OSes to limit manipulation of a video tag with JavaScript.

To sum up: use the rmp-vast API `loadAds()` method to start playback. On mobile devices this should be the result of a direct user interaction. You can also use muted autoplay to start playback. Refer to the [autoplay](#autoplay-support) section.

If you do not want to call `loadAds()` method directly - call `initialize()` method (as a result of a user interaction) then call `loadAds()` later on when you wish to load a VAST tag.

[Back to documentation sections](#documentation-sections)

### API events

rmp-vast will fire VAST-related events on the rmp-vast instance as they occur. Events are registered with the `on` method applied to the rmp-vast instance (`rmpVast` as shown above). They are unregistered with the `off` method. Example:

```javascript
const rmpVast = new RmpVast(id, params);
rmpVast.on("adstarted", callbackA);
rmpVast.loadAds(adTag);
```

You can register multiple events for the same callback, example:

```javascript
const rmpVast = new RmpVast(id, params);
rmpVast.on("adloaded adstarted", callbackA);
rmpVast.loadAds(adTag);
```

You can access the name of the event being fired:

```javascript
function callbackA(event) {
  console.log(event.type); // name of the event being fired
}
const rmpVast = new RmpVast(id, params);
rmpVast.on("adloaded adstarted adclick", callbackA);
rmpVast.loadAds(adTag);
```

You can unregister an event with the off method:

```javascript
rmpVast.off("adstarted", callbackA);
```

You can unregister multiple events for the same callback as well:

```javascript
rmpVast.off("adloaded adstarted adclick", callbackA);
```

You can also register an event where the callback is only executed once:

```javascript
const rmpVast = new RmpVast(id, params);
rmpVast.one("adstarted", callbackA);
rmpVast.loadAds(adTag);
```

Available events are:

- `adloaded`
- `addurationchange`
- `adclick`
- `adclosed`
- `adimpression`
- `adcreativeview`
- `adcollapse`
- `adstarted`
- `adtagloaded`
- `adprogress`
- `adviewable`
- `adviewundetermined`
- `adinitialplayrequestfailed`
- `adinitialplayrequestsucceeded`
- `adpaused`
- `adresumed`
- `adtagstartloading`
- `advolumemuted`
- `advolumeunmuted`
- `advolumechanged`
- `adskipped`
- `adskippablestatechanged`
- `adfirstquartile`
- `admidpoint`
- `adthirdquartile`
- `adcomplete`
- `adplayerexpand`
- `adplayercollapse`
- `adfullscreen`
- `adexitfullscreen`
- `adiconclick`
- `aderror`
- `addestroyed`
- `adpodcompleted`

The `adinitialplayrequestfailed` event tells if the ad (or content in case of non-linear creatives) player was able to play on first attempt. Typically this event will fire when autoplay is requested but blocked by an interference engine (macOS Safari 11+, Chrome 66+, browser extensions ...). If the initial play request was a success, the `adinitialplayrequestsucceeded` event will fire.

VPAID (DEPRECATED) related events:

- `adlinearchange`
- `adsizechange`
- `adexpandedchange`
- `adremainingtimechange`
- `adinteraction`
- `aduseracceptinvitation`
- `adcollapse`

[Back to documentation sections](#documentation-sections)

### API methods

Once a rmp-vast instance is created you can query the API methods to interact with the player. Example:

```javascript
const rmpVast = new RmpVast(id);
...
rmpVast.pause();
...
rmpVast.volume = 0.5;
```

For linear ads rmp-vast exposes 2 players: a content player (for the actual content) and a ad player (for the loaded ad).

**API methods**

- `play()`: play content or ad player depending on what is on stage.
- `pause()`: pause content or ad player depending on what is on stage.
- `loadAds(vastUrl: String, regulationsInfo: Object, requireCategory: Boolean)`: load a new VAST tag and start displaying it - if rmp-vast is not initialized when loadAds is called then `initialize()` is called first. Input parameters are
  - `vastUrl: String` the URI to the VAST resource to be loaded
  - `regulationsInfo: Object` data for regulations as
    - `regulationsInfo.regulations: String` coppa|gdpr for REGULATIONS macro
    - `regulationsInfo.limitAdTracking: String` 0|1 for LIMITADTRACKING macro
    - `regulationsInfo.gdprConsent: String` Base64-encoded Cookie Value of IAB GDPR consent info for GDPRCONSENT macro
  - `requireCategory: Boolean` for enforcement of VAST 4 Ad Categories
- `initialize()`: initialize rmp-vast - this method can be used in case of deferred use of `loadAds()` - Note that when autoplay is not wanted the call to `initialize()` must be the result of a direct user interaction.
- `stopAds()`: stop playing the ad on stage. You may call loadAds again after invoking stopAds.
- `destroy()`: stop playing the ad on stage and destroy the current RmpVast instance. You may not call loadAds again after invoking destroy, you will need to create a new RmpVast instance.
- `skipAd()`: skips the creative on stage - this method only has effects if the creative on stage is a skippable ad and can be skipped (e.g. `adSkippableState` returns true).

**API methods getter|setter**

The following getter|setter should be queried after the `adstarted` event has fired:

- `adPaused`: getter-only returns `Boolean`, stating if the ad on stage is paused or not.
- `volume`: getter returns `Number`, volume of (content|ad) player. Returned value is a number between 0 and 1. -1 is returned if this value is not available | setter sets volume of (content|ad) player.
- `muted`: getter returns `Boolean`, the mute state of (content|ad) player | setter sets (content|ad) player mute state.
- `adTagUrl`: getter-only returns `String`, representing the current VAST tag URL.
- `adOnStage`: getter-only returns `Boolean`, stating if an ad is currently on stage.
- `initialized`: getter-only returns `Boolean`, stating if rmp-vast has been initialized.
- `adMediaUrl`: getter-only returns `String`, representing the selected creative URL.
- `adLinear`: getter-only returns `Boolean`, representing the type of the selected creative either linear (true) or non linear (false).
- `adSystem`: getter-only returns `{value: String, version: String}`, representing the VAST AdSystem tag.
- `adUniversalAdIds`: getter-only returns `[{idRegistry: String, value: String}]`, representing the VAST UniversalAdId tag.
- `adContentType`: getter-only returns `String`, representing the MIME type for the selected creative.
- `adTitle`: getter-only returns `String`, representing the VAST AdTitle tag.
- `adDescription`: getter-only returns `String`, representing the VAST Description tag.
- `adAdvertiser`: getter-only returns `{id: String, value: String}`, representing the VAST Advertiser tag.
- `adPricing`: getter-only returns `{value: String, model: String, currency: String}`, representing the VAST Pricing tag.
- `adSurvey`: getter-only returns `String`, representing the VAST Survey tag.
- `adAdServingId`: getter-only returns `String`, representing the VAST AdServingId tag.
- `adCategories`: getter-only returns `{authority: String, value: String}[]`, representing the VAST Category tag.
- `adBlockedAdCategories`: getter-only returns `{authority: String, value: String}[]`, representing the VAST BlockedAdCategories tag.
- `adDuration`: getter-only returns `Number` in ms, representing the duration of the selected linear creative. -1 is returned if this value is not available.
- `adCurrentTime`: getter-only returns `Number` in ms, representing the current timestamp in the selected linear creative. -1 is returned if this value is not available.
- `adRemainingTime`: getter-only returns `Number` in ms, representing the current time remaining in the selected linear creative. -1 is returned if this value is not available.
- `adMediaWidth`: getter-only returns `Number`, representing the width of the selected creative. -1 is returned if this value is not available.
- `adMediaHeight`: getter-only returns `Number`, representing the height of the selected creative. -1 is returned if this value is not available.
- `clickThroughUrl`: getter-only returns `String`, representing the click-through (e.g. destination) URL for the selected creative.
- `isSkippableAd`: getter-only returns `Boolean`, stating if the loaded linear ad is a VAST skippable ad - can be queried when adloaded event fires.
- `skipTimeOffset`: getter-only returns `Number` giving the skip offset when a skippable ad is displayed.
- `adSkippableState`: getter-only returns `Boolean`, stating if the creative on stage can be skipped or not.
- `contentPlayerCompleted`: getter returns `Boolean` | setter sets the contentPlayerCompleted state of the player. This is used when source of content player changes and we need to explicitly reset contentPlayerCompleted internal value so that content can resume as expected on next ad load.

Additional AdPod-related methods

- `adPodInfo`: getter-only return `{adPodCurrentIndex: Number, adPodLength: Number}` giving information about the currently playing pod.

Additional VPAID-related methods

- `resizeAd(width: Number, height: Number, viewMode: String)`: resizes the VPAID creative based on `width`, `height` and `viewMode`. viewMode should be either 'normal' or 'fullscreen'.
- `expandAd()`: expands the VPAID creative on stage.
- `collapseAd()`: collapses the VPAID creative on stage.
- `adExpanded`: getter-only return `Boolean`, stating if the VPAID creative on stage is expanded or not.
- `vpaidCompanionAds`: getter-only return `String`, providing ad companion details in VAST 3.0 format for the `<CompanionAds>` element.

The following methods should be queried after the `aderror` event has fired:

- `adErrorMessage`: getter-only return `String`, representing the error message for the current error.
- `adVastErrorCode`: getter-only return `Number`, representing the VAST error code for the current error. -1 is returned if this value is not available.
- `adErrorType`: getter-only return `String`, representing the detected ad error type, possible values: 'adLoadError', 'adPlayError' or '' (if unknown error type).

The following methods provide context information for the rmp-vast instance:

- `environment`: getter-only return `Object`, data about the environment that rmp-vast runs into.
- `adPlayer`: getter-only return `HTMLMediaElement|null`, the ad player video tag.
- `contentPlayer`: getter-only return `HTMLMediaElement|null`, the content player video tag.

[Back to documentation sections](#documentation-sections)

## Companion ads support

We support StaticResource, IFrameResource and HTMLResource in Companion tags.

We also support AltText, CompanionClickThrough, CompanionClickTracking, TrackingEvents tags in Companion tags.

We support "required" attribute for CompanionAds tag as well as "adSlotId" attribute for Companion tag.

We also support CompanionAds in wrappers/redirects (The CompanionAds nearer to the final linear creative will be selected).

See ./test/spec/companionSpec/ for examples of implementation.

The following methods must be queried when the `adstarted` event fires.

- `getCompanionAdsList(width: Number, height: Number)`: return `Object[]`. Each Object in the Array represents a companion ad. Input `width` and `height` parameters are used to select companion ads based on available width and height for display. Each companion ad Object is represented as:

```javascript
{
  adSlotId: "RMPSLOTID-1",
  altText: "Radiant Media Player logo",
  companionClickThroughUrl: "https://www.radiantmediaplayer.com",
  companionClickTrackingUrl: "https://www.radiantmediaplayer.com/vast/tags/ping.gif?creativeType=companion&type=companionClickTracking",
  height: 250,
  imageUrl: "https://www.radiantmediaplayer.com/vast/mp4s/companion.jpg",
  trackingEventsUri: [
    "https://www.radiantmediaplayer.com/vast/tags/ping.gif?creativeType=companion&type=creativeView",
    "https://www.radiantmediaplayer.com/vast/tags/ping.gif?creativeType=companion&type=creativeViewTwo"
  ],
  width: 300
}
```

Not all fields may be available, so check availability before usage.

- `getCompanionAd(index: Number)`: return `HTMLElement|null` representing the companion ad. It takes a `Number` index parameter which represents the index of the wanted companion ad in the Array returned from `getCompanionAdsList` method. This method automates the required pinging for companion ads. Usage example:

```javascript
rmpVast.on("adstarted", function () {
  // we need to call getCompanionAdsList BEFORE calling getCompanionAd so that
  // rmp-vast can first create a collection of available companion ads based on getCompanionAdsList
  // input parameters
  const list = rmpVast.getCompanionAdsList(900, 750);
  if (list && list.length === 3) {
    const img = rmpVast.getCompanionAd(2);
    if (img) {
      // we get our companion ad image and we can append it to DOM now
      // VAST trackers will be called automatically when needed
      const companionId = document.getElementById("companionId");
      companionId.appendChild(img);
    }
  }
});
```

- `companionAdsRequiredAttribute`: getter-only return a `String` representing the "required" attribute for CompanionAds tag. Value can be all, any, none or an empty String when this attribute is not defined. See section 2.3.3.4 of VAST 3 specification for more information.

[Back to documentation sections](#documentation-sections)

## AdVerifications OM Web SDK

rmp-vast supports AdVerifications through the [IAB OM Web SDK](https://iabtechlab.com/standards/open-measurement-sdk/). Our implementation is based on IAB GitHub [Open-Measurement-JSClients](https://github.com/InteractiveAdvertisingBureau/Open-Measurement-JSClients) and sports OM Web SDK version 1.4.12

- This feature needs to be activated through `omidSupport: true` setting
- You need to add ./externals/omweb-js-X.X.X/Service/omweb-v1.js and ./externals/omweb-js-X.X.X/Session-Client/omid-session-client-v1.js to your page through a script tag
- Note that we currently only support Creative Access Mode (e.g. full)

Feedback is welcome. Please see ./test/spec/omWebSpec/ for implementation examples.

[Back to documentation sections](#documentation-sections)

## SIMID support

### As SIMID is a new format in the industry, feedback is welcome - open a PR/issue for bugs and improvements

[SIMID](https://interactiveadvertisingbureau.github.io/SIMID/simid-1.1.0.html) replaces VPAID for interactive creatives. We only support linear SIMID creatives for the moment. See test/simidSpec/ for an implementation example. This feature is enabled by default but can be turned off with `enableSimid: false` setting.

## VPAID support

### --- DEPRECATED with rmp-vast 7 ---

Current VPAID support limitations:

- supports only linear VPAID
- no support for changes in linearity (likely to cause playback issues)

[Back to documentation sections](#documentation-sections)

## HLS creatives support

We support linear creatives in HLS format on all supported devices for rmp-vast. This is made possible thanks to the [hls.js project](https://github.com/video-dev/hls.js). Make sure to add ./externals/hls/hls.min.js to your page and enable this feature with `useHlsJS: true` setting. See ./test/spec/inlineLinearSpec/hls-creative.html for an example.

[Back to documentation sections](#documentation-sections)

## Macros

rmp-vast supports most [VAST 4.3 macros](https://interactiveadvertisingbureau.github.io/vast/vast4macros/vast4-macros-latest.html) automatically. There are however macros that need to be set explicitly or that are not currently supported by rmp-vast. You can pass values for those macros with the `macros` setting (they will be replaced by rmp-vast for ping URLs). Example:

```javascript
const id = "vast-player";
const macrosMap = new Map();
macrosMap.set("CLIENTUA", encodeURIComponent("MyPlayer/1.0 rmp-vast/15.0.0"));
macrosMap.set("PLAYBACKMETHODS", 2);
const params = {
  showControlsForAdPlayer: true,
  macros: macrosMap,
};
const rmpVast = new RmpVast(id, params);
rmpVast.loadAds("your-ad-tag-url");
```

Macros that need to be set explicitly if you want to support them: CONTENTCAT, GPPSECTIONID, GPPSTRING, PLAYBACKMETHODS, STOREID, STOREURL, BREAKMAXADLENGTH, BREAKMAXADS, BREAKMAXDURATION, BREAKMINADLENGTH, PLACEMENTTYPE, TRANSACTIONID, CLIENTUA, DEVICEIP, IFA, IFATYPE, LATLONG, SERVERUA, APPBUNDLE, EXTENSIONS, OMIDPARTNER, VERIFICATIONVENDORS, CONTENTID, CONTENTURI, INVENTORYSTATE.

## Autoplay support

This is done by simply calling `loadAds` method on page load (after HTML5 content video player is in DOM and rmp-vast library is loaded and instantiated). In many environments, only muted autoplay is available (iOS, Android, Desktop Chrome 66+ and Desktop Safari 11+), so add the `muted` attribute on the HTML5 content video player.

[Back to documentation sections](#documentation-sections)

## Fullscreen management

rmp-vast supports fullscreen for the global player (e.g. content + ad players) but there is an extra layer to add to your application. See the ./app/js/app.js file around line 25 for an example of implementation.

[Back to documentation sections](#documentation-sections)

## Pre, mid and post rolls

rmp-vast can handle pre/mid/post rolls ad breaks through the loadAds API method. See ./test/spec/apiSpec/pre-mid-post-roll.html for an example.

[Back to documentation sections](#documentation-sections)

## Outstream ads

rmp-vast supports displaying outstream ads when parameter `outstream` is set to true. For an implementation example see ./test/spec/outstreamSpec/Simple.html.

[Back to documentation sections](#documentation-sections)

## TypeScript support

Make sure to include ./types folder in your TypeScript configuration file and you can start using rmp-vast in a TypeScript environment. Note: the resulting .d.ts files are generated from JavaScript using JSDoc syntax.

## Contributing

Contributions are welcome. Please review general code structure and stick to existing patterns.
Provide test where appropriate (see ./test folder). Tests are written with Jasmine and automated with [selenium web driver](https://github.com/SeleniumHQ/selenium) and are validated in latest webdriver for Chrome and Firefox for Windows 11. Additionally we test on latest Chrome for Android and latest macOS and iOS Safari.

To develop rmp-vast do install it (you need to have node.js installed globally):

`git clone https://github.com/radiantmediaplayer/rmp-vast.git`

`npm install`

Make changes to code and then run:

`npm run dev`

When your changes are ready for commit, build rmp-vast:

`npm run build`

Before committing for a pull request - run test:

`npm run test:patch`

Make sure the ctrf-chrome.json file in report/v${version} has all test passed - test manually for false negative.
Also note we test on Safari for macOS and Chrome for Android. Some more advanced tests require manual verification and are located in test/spec/manualSpec/ and should be run in latest Chrome for Windows|macOS|Linux.

[Back to documentation sections](#documentation-sections)

## License

rmp-vast is released under MIT.

[Back to documentation sections](#documentation-sections)

## Radiant Media Player

If you like rmp-vast you can check out [Radiant Media Player](https://www.radiantmediaplayer.com) - A Modern Go-everywhere HTML5 Video Player - Create web, mobile & OTT video apps in a snap.

Radiant Media Player is a commercial HTML5 media player, not covered by rmp-vast MIT license.

You may request a free trial for Radiant Media Player at: [https://www.radiantmediaplayer.com/free-trial.html](https://www.radiantmediaplayer.com/free-trial.html).

[Back to documentation sections](#documentation-sections)
