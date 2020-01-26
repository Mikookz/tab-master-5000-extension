import React from 'react';
import {StyleSheet, css} from 'aphrodite';
import _ from 'lodash';
import moment from 'moment';
import {findIndex} from '@jaszhix/utils';

import state from './stores/state';
import themeStore from './stores/theme';

import {Panel} from './bootstrap';
import style from './style';
import {unref} from './utils';
import * as utils from './stores/tileUtils';

const styles = StyleSheet.create({
  headerContainer: {position: 'relative', minHeight: '18px'},
  mediaLeft: {paddingRight: '6px'},
  mediaLeftImage: {width: '16px', height: '16px'}
});

interface TileProps {
  tab: ChromeTab & ChromeExtensionInfo;
  prefs: PreferencesState;
  context: ContextState;
  theme: Theme;
  i: number;
  folder: string;
  onDragStart: (e: React.DragEvent, i: number) => void;
  onDragEnd: React.DragEventHandler;
  onDragOver: React.DragEventHandler;
  wallpaper: Wallpaper;
  chromeVersion: number;
  tileLetterTopPos: number;
}

interface TileState {
  hover?: boolean;
  xHover?: boolean;
  pHover?: boolean;
  mHover?: boolean;
  stHover?: boolean;
  render?: boolean;
  close?: boolean;
  pinning?: boolean;
  dataUrl?: string;
  duplicate?: boolean;
  screenshot?: string;
  openTab?: boolean;
  tab?: ChromeTab;
  i?: number;
}

class Tile extends React.Component<TileProps, TileState> {
  connectId: number;
  panelRef: HTMLElement;

  constructor(props) {
    super(props);

    this.state = {
      hover: false,
      xHover: false,
      pHover: false,
      mHover: false,
      stHover: false,
      render: true,
      close: false,
      pinning: false,
      dataUrl: null,
      duplicate: false,
      screenshot: null,
      openTab: false,
      tab: this.props.tab,
      i: this.props.i
    }
    this.connectId = state.connect({
      duplicateTabs: this.handleDuplicates,
      screenshots: this.updateScreenshot,
      screenshotClear: () => {
        this.setState({screenshot: null}, () => state.set({screenshotClear: false}));
      }
    });
  }
  componentDidMount = () => {
    this.updateScreenshot();
    utils.checkDuplicateTabs(this.props.tab, (duplicate) => this.setState({duplicate}));
  }
  shouldComponentUpdate = (nP, nS) => {
    return (!_.isEqual(this.props, nP) || !_.isEqual(this.state, nS) || state.screenshotClear) && state.settings !== 'sessions';
  }
  componentWillUnmount = () => {
    state.disconnect(this.connectId);
    unref(this);
  }
  handleDuplicates = () => {
    utils.checkDuplicateTabs(this.props.tab, (duplicate) => {
      if (duplicate !== this.state.duplicate) this.setState({duplicate})
    });
  }
  updateScreenshot = () => {
    if (!state.prefs.screenshot) return;

    const {tab} = this.props;
    const refSS = findIndex(state.screenshots, ss => ss && ss.url === tab.url);

    if (refSS > -1) {
      this.setState({screenshot: state.screenshots[refSS].data});
    }
  }
  filterFolders = (folderName) => {
    let p = this.props;
    state.set({folder: p.folder ? false : folderName});
  }
  handleClick = () => {
    if (this.state.close) {
      return;
    }
    utils.activateTab(this.props.tab);
  }
  // Trigger hovers states that will update the inline CSS in style.js.
  handleHoverIn = () => {
    if (state.dragging) {
      return false;
    }
    let s = this.state;
    let p = this.props;
    this.setState({hover: true});
    if (p.prefs.screenshot && p.prefs.screenshotBg) {
      if (s.screenshot && p.prefs.mode !== 'apps') {
        themeStore.trigger('currentWallpaper', {hoverWallpaper: {data: s.screenshot}, theme: p.theme});
      } else if (p.wallpaper && p.wallpaper.data !== -1) {
        themeStore.trigger('currentWallpaper', {hoverWallpaper: {data: p.wallpaper.data}, theme: p.theme});
      } else {
        document.getElementById('bgImg').style.backgroundImage = '';
      }
    }
  }
  handleHoverOut = () => {
    this.setState({hover: false});
  }
  handleTabCloseHoverIn = () => {
    this.setState({xHover: true});
  }
  handleTabCloseHoverOut = () => {
    this.setState({xHover: false});
  }
  handlePinHoverIn = () => {
    this.setState({pHover: true});
  }
  handlePinHoverOut = () => {
    this.setState({pHover: false});
  }
  handleTabMuteHoverIn = () => {
    this.setState({mHover: true});
  }
  handleTabMuteHoverOut = () => {
    this.setState({mHover: false});
  }
  handleContextClick = (e) => {
    e.preventDefault();
    if (!this.props.prefs.context) {
      return;
    }
    if (this.props.context.id && this.props.context.id.id === this.props.tab.id) {
      state.set({context: {value: false, id: null}})
    } else {
      state.set({context: {value: true, id: this.props.tab}});
    }
  }
  handleCloseTab = () => {
    this.setState({duplicate: false, close: true, screenshot: null});
    utils.closeTab(this.props.tab);
  }
  handleMute = () => {
    utils.mute(this.props.tab);
  }
  handlePinning = () => {
    if (state.prefs.animations) {
      this.setState({pinning: true});
    }
    utils.pin(this.props.tab);
  }
  handleDragStart = (e) => {
    this.props.onDragStart(e, this.props.i);
    _.defer(() => this.setState({render: false}));
  }
  handleDragEnd = (e) => {
    this.props.onDragEnd(e);
    this.setState({render: true});
  }
  getPanelRef = (ref) => {
    this.panelRef = ref;
  }
  render = () => {
    let s = this.state;
    let p = this.props;
    style.ssIconBg = _.cloneDeep(_.assignIn(style.ssIconBg, {
      backgroundColor: p.theme.tileButtonBg
    }));
    style.ssPinnedIconBg = _.cloneDeep(_.assignIn(style.ssPinnedIconBg, {
      color: p.theme.tilePinned,
      backgroundColor: p.theme.tileButtonBg
    }));

    let titleFontSize = p.tab.title.length >= 115 ? 13 : 14;
    let hasDiscarded = p.chromeVersion >= 54; // should be in parent
    let openTab = p.tab.hasOwnProperty('openTab') && p.tab.openTab;
    let isTab = p.prefs.mode === 'tabs' || openTab;
    let isLoading = p.tab.status === 'loading';

    let sanitize = (str) => {
      let result = str.replace(/[^a-z0-9]/gi, '')[0];
      if (result !== undefined) {
        return result.toUpperCase();
      } else {
        return '';
      }
    };
    if (s.hover) {
      titleFontSize--;
    }
    let subTitleStyle = {
      whiteSpace: 'nowrap',
      position: 'absolute',
      right: '9px',
      zIndex: '12',
      color: themeStore.opacify(p.theme.tileText, 0.6),
      backgroundColor: p.theme.tileBg,
      paddingLeft: '4px',
      paddingRight: '4px',
      opacity: s.stHover ? '0.2' : '1',
      transition: p.prefs.animations ? 'opacity 0.2s, white-space 0.1s' : 'initial'
    };

    const dynamicStyles: any = StyleSheet.create({
      ST1: Object.assign({
        top: `${p.prefs.tabSizeHeight - 40}px`,
        cursor: p.prefs.mode === 'sessions' || p.prefs.mode === 'bookmarks' ? 'default' : 'initial'
      }, subTitleStyle),
      ST2 : Object.assign({
        top: `${p.prefs.tabSizeHeight - 55}px`,
        cursor: p.prefs.mode === 'sessions' || p.prefs.mode === 'bookmarks' ? 'pointer' : 'default'
      }, subTitleStyle),
      // @ts-ignore
      panelContainer: {
        position: 'relative',
        display: s.render ? 'block' : 'none',
        height: p.prefs.tabSizeHeight,
        width: `${p.prefs.tabSizeHeight + 80}px`,
        float: 'left',
        margin: '6px',
        backgroundColor: s.hover ? p.theme.tileBgHover : p.theme.tileBg,
        backgroundImage: `url('${s.screenshot ? s.screenshot : p.tab.favIconUrl}')`,
        backgroundBlendMode: s.screenshot ? 'multiply, lighten' : 'luminosity',
        backgroundPosition: 'center',
        backgroundSize: s.screenshot ? 'cover' : 'contain',
        backgroundRepeat: s.screenshot ? 'initial' : 'no-repeat',
        overflow: 'hidden',
        zIndex: '50',
        opacity: s.close ? '0' : p.tab.hasOwnProperty('enabled') && !p.tab.enabled ? '0.5' : hasDiscarded && p.tab.discarded ? '0.5' : '1',
        transition: p.prefs.animations ? 'opacity 0.2s' : 'initial',
        animationIterationCount: s.duplicate ? 'infinite' : 'initial',
        animationDuration: s.duplicate ? '5s' : '0.2s',
        cursor: 'pointer'
      },
      // @ts-ignore
      panelBody: {
        height: s.hover ? `18px` : `${p.prefs.tabSizeHeight - 40}px`,
        width: p.prefs.tabSizeHeight+80,
        padding: s.hover ? '0px' : 'initial',
        borderRadius: '0px',
        backgroundImage: `url('${p.tab.favIconUrl}')`,
        backgroundBlendMode: 'luminosity',
        backgroundPosition: 'center',
        backgroundSize: '1px, auto, contain',
        opacity: s.screenshot ? '0.4' : '0.8',
        transition: p.prefs.animations ? 'padding 0.1s, height 0.1s, opacity 0.1s, background-size 0.1s' : 'initial',
        transitionTimingFunction: 'ease-in-out',
        zIndex: s.hover ? '2' : '1',
        cursor: 'pointer'
      },
      // @ts-ignore
      panelFooter: {
        backgroundColor: s.hover ? p.theme.tileBgHover : p.theme.tileBg,
        borderBottomRightRadius: '2px',
        borderBottomLeftRadius: '2px',
        width: p.prefs.tabSizeHeight+80,
        position: 'absolute',
        padding: `${s.hover ? 4 : 0}px 6px`,
        minHeight: s.hover ? `100%` : '40px',
        height: s.hover ? `100%` : '40px',
        maxHeight: s.hover ? `100%` : '40px',
        transition: p.prefs.animations ? 'padding 0.1s, height 0.1s, min-height 0.1s, max-height 0.1s, background-color 0.2s' : 'initial',
        transitionTimingFunction: 'ease-in-out',
        overflow: 'hidden',
        zIndex: s.hover ? '1' : '2'
      },
      footerTitleContainer: {
        color: p.theme.tileText,
        textShadow: `2px 2px ${p.theme.tileTextShadow}`,
        width: p.prefs.tabSizeHeight+40,
        overflow: 'hidden',
        cursor: 'pointer'
      },
      footerTitleLink: {
        fontSize: `${titleFontSize}px`,
        color: p.theme.tileText,
        transition: p.prefs.animations ? 'font-size 0.2s' : 'initial'
      },
      footerSubTitleContainer: {
        whiteSpace: s.hover ? 'initial' : 'nowrap',
        transition: p.prefs.animations ? 'white-space 0.1s' : 'initial',
        color: themeStore.opacify(p.theme.tileText, 0.8)
      },
      // @ts-ignore
      panelHeading: {
        width: `${p.prefs.tabSizeHeight + 80}px`,
        padding: '0px',
        borderRadius: '0px',
        backgroundColor: s.hover ? p.theme.tileBg : p.tab.pinned || p.tab.mutedInfo.muted || p.tab.audible || s.duplicate ? themeStore.opacify(p.theme.tileBg, 0.8) : 'rgba(255, 255, 255, 0)',
        position: 'absolute',
        zIndex: '11',
        transition: p.prefs.animations ? 'opacity 0.2s, background-color 0.1s' : 'initial',
        cursor: 'default'
      },
      // @ts-ignore
      titleContainer: {
        color: p.theme.tileText,
        fontSize: '70px',
        textAlign: 'center',
        opacity: s.hover ? '0' : '1',
        zIndex: s.hover ? '-1' : '1',
        position: 'relative',
        top: `${p.tab.pinned && p.prefs.tabSizeHeight <= 140 ? 0 : p.tileLetterTopPos}%`
      },
      headerIconContainer: {
        display: 'flex',
        position: 'relative',
        left: `${p.prefs.tabSizeHeight + (isTab ? s.duplicate || isLoading ? 22 : 27 : p.prefs.mode === 'apps' || p.prefs.mode === 'extensions' ? 46 : 62)}px`,
        top: '1px'
      },
      iconCommon: {
        display: 'block',
        cursor: 'pointer',
        position: 'relative'
      },
      // @ts-ignore
      muteIcon: {
        color: s.mHover ? p.tab.audible ? p.theme.tileMuteAudibleHover : p.theme.tileMuteHover : p.tab.audible ? p.theme.tileMuteAudible : p.theme.tileMute,
        opacity: s.hover || p.tab.mutedInfo.muted || p.tab.audible ? '1' : '0',
        top: '2px',
        right: '2px',
        fontSize: '13.5px'
      },
      // @ts-ignore
      pinIcon: {
        color: s.pHover ? p.theme.tilePinHover : p.theme.tilePin,
        opacity: s.hover || p.tab.pinned ? '1' : '0',
        top: '2px',
        right: '2px',
        fontSize: '12px'
      },
      // @ts-ignore
      closeIcon: {
        color: s.xHover ? p.theme.tileXHover : p.theme.tileX,
        opacity: s.hover ? '1' : '0',
        top: isTab ? '-1px' : '1px',
        right: isTab ? 'initial' : '0px',
        fontSize: isTab ? '16px' : '12px'
      },
      // @ts-ignore
      offlineEnabledIcon: {
        color: s.pHover ? p.theme.tilePinHover : p.theme.tilePin,
        opacity: p.tab.offlineEnabled ? '1' : '0',
        top: '2px',
        right: '2px',
        fontSize: '12px'
      },
      // @ts-ignore
      homepageIcon: {
        color: s.xHover ? p.theme.tileXHover : p.theme.tileX,
        opacity: s.hover ? '1' : '0',
        top: isTab ? '-1px' : '1px',
        right: isTab ? 'initial' : '0px',
        fontSize: isTab ? '16px' : '12px'
      },
      notificationIcon: {
        color: p.theme.tileMuteAudibleHover,
        top: '2px',
        left: `-${p.prefs.tabSizeHeight + 20}px`,
        fontSize: '13px',
        position: 'absolute',
        transition: 'opacity 0.5s',
        animationIterationCount: 'infinite',
        animationDuration: '1s'
      }
    })
    return (
      <Panel
      ref={this.getPanelRef}
      draggable={p.prefs.mode === 'tabs' && p.prefs.drag}
      onDragEnd={this.handleDragEnd}
      onDragStart={this.handleDragStart}
      onDragOver={p.onDragOver}
      footerLeft={
        <div className="metadata-container">
          <div className={`media-left ${css(styles.mediaLeft)}`}>
            <img src={p.tab.favIconUrl} className={css(styles.mediaLeftImage)} />
          </div>
          <div className="media-left">
            <div className={css(dynamicStyles.footerTitleContainer)}>
              <a className={css(dynamicStyles.footerTitleLink)}>
                {p.tab.title.length > 0 ? p.tab.title : p.tab.domain ? p.tab.domain : p.tab.url.split('/')[2]}
              </a>
            </div>
            {p.prefs.mode === 'apps' || p.prefs.mode === 'extensions' ?
            <div className={css(dynamicStyles.footerSubTitleContainer) + ' text-muted text-size-small'}>
              {p.tab.description}
            </div> : null}
            {p.prefs.mode === 'tabs' || p.prefs.mode === 'history' || p.prefs.mode === 'bookmarks' || p.prefs.mode === 'sessions' ?
            <div
            onMouseEnter={() => this.setState({stHover: true})}
            onMouseLeave={() => this.setState({stHover: false})}>
              <div onClick={this.handleClick} className={css(dynamicStyles.ST1) + ' text-muted text-size-small'}>
                {p.tab.domain ? p.tab.domain : p.tab.url.split('/')[2]}
              </div>
              {isTab && hasDiscarded && p.tab.discarded ?
              <div onClick={this.handleClick} className={css(dynamicStyles.ST2) + ' text-muted text-size-small'}>
                Discarded
              </div> : null}
              {p.prefs.mode === 'history' ?
              <div onClick={this.handleClick} className={css(dynamicStyles.ST2) + ' text-muted text-size-small'}>
                {_.capitalize(moment(p.tab.lastVisitTime).fromNow())}
              </div> : null}
              {p.prefs.mode === 'bookmarks' ?
              <div onClick={() => this.filterFolders(p.tab.folder)} className={css(dynamicStyles.ST2) + ' text-muted text-size-small'}>
                {p.tab.folder}
              </div> : null}
              {p.prefs.mode === 'sessions' ?
              <div
              onClick={() => this.filterFolders(p.tab.originSession)}
              className={css(p.tab.hasOwnProperty('domain') && p.tab.domain ? dynamicStyles.ST2 : dynamicStyles.ST1) + ' text-muted text-size-small'}>
                {p.tab.label ? p.tab.label : _.capitalize(moment(p.tab.sTimeStamp).fromNow())}
              </div> : null}
            </div> : null}
            {p.prefs.mode === 'apps' || p.prefs.mode === 'extensions' ?
            <div onMouseEnter={() => this.setState({stHover: true})} onMouseLeave={() => this.setState({stHover: false})}>
              <div
              onClick={() => this.filterFolders(p.tab.originSession)}
              className={css(dynamicStyles.ST1) + ' text-muted text-size-small'}>
                {`v${p.tab.version}`}
              </div>
            </div> : null}
          </div>
        </div>
      }
      header={
        <div className={css(styles.headerContainer)}>
          <ul className={css(dynamicStyles.headerIconContainer) + ' icons-list'}>
            {isTab && (s.duplicate || isLoading) ?
            <li>
              <i
              title={isLoading ? utils.t('loading') : utils.t('duplicateTab')}
              className={css(dynamicStyles.notificationIcon) + ` icon-${isLoading ? 'spinner2 rotating' : `notification2 ${p.prefs.animations && p.prefs.duplicate ? 'pulse' : ''}`} `}
              onMouseEnter={this.handlePinHoverIn}
              onMouseLeave={this.handlePinHoverOut} />
            </li>
            : null}
            {(p.chromeVersion >= 46 || p.chromeVersion === 1) && (openTab || p.prefs.mode === 'tabs') ?
            <li>
              <i
              title={`${p.tab.mutedInfo.muted ? utils.t('unmute') : utils.t('mute')} ${utils.t('tab')}${p.tab.audible ? ' ('+utils.t('audible')+')' : ''}`}
              className={css(dynamicStyles.muteIcon, dynamicStyles.iconCommon) + ` icon-volume-${p.tab.mutedInfo.muted ? 'mute2' : p.tab.audible ? 'medium' : 'mute'}`}
              onMouseEnter={this.handleTabMuteHoverIn}
              onMouseLeave={this.handleTabMuteHoverOut}
              onClick={this.handleMute} />
            </li>
            : null}
            {isTab ?
            <li>
              <i
              title={`${p.tab.pinned ? utils.t('unpin') : utils.t('pin')} ${utils.t('tab')}`}
              className={css(dynamicStyles.pinIcon, dynamicStyles.iconCommon) + ' icon-pushpin'}
              onMouseEnter={this.handlePinHoverIn}
              onMouseLeave={this.handlePinHoverOut}
              onClick={this.handlePinning} />
            </li>
            : null}
            {p.prefs.mode !== 'apps' && p.prefs.mode !== 'extensions' ?
            <li>
              <i
              title={`${isTab ? utils.t('close') : utils.t('remove')} ${_.trimEnd(_.upperFirst(utils.t(p.prefs.mode)), 's')}${p.prefs.mode === 'sessions' ? ' '+utils.t('tab') : ''}`}
              className={css(dynamicStyles.closeIcon, dynamicStyles.iconCommon) + ` icon-${isTab ? 'cross2' : 'eraser'} ntg-x`}
              onMouseEnter={this.handleTabCloseHoverIn}
              onMouseLeave={this.handleTabCloseHoverOut}
              onClick={this.handleCloseTab} />
            </li> : null}
            {(p.prefs.mode === 'apps' || p.prefs.mode === 'extensions') ?
            <li>
              <i
              title={utils.t('offlineEnabled')}
              className={css(dynamicStyles.offlineEnabledIcon, dynamicStyles.iconCommon) + ' icon-power2'}
              onMouseEnter={this.handlePinHoverIn}
              onMouseLeave={this.handlePinHoverOut} />
            </li>
            : null}
            {(p.prefs.mode === 'apps' || p.prefs.mode === 'extensions') ?
            <li>
              <i
              title={`${_.trimEnd(_.upperFirst(utils.t(p.prefs.mode)), 's')} ${utils.t('homepage')}`}
              className={css(dynamicStyles.homepageIcon, dynamicStyles.iconCommon) + ' icon-home5 ntg-x'}
              onMouseEnter={this.handleTabCloseHoverIn}
              onMouseLeave={this.handleTabCloseHoverOut}
              onClick={() => chrome.tabs.create({url: p.tab.homepageUrl})} />
            </li> : null}
          </ul>
        </div>
      }
      className={css(dynamicStyles.panelContainer)}
      bodyStyle={css(dynamicStyles.panelBody)}
      footerStyle={css(dynamicStyles.panelFooter)}
      headingStyle={css(dynamicStyles.panelHeading)}
      onMouseEnter={this.handleHoverIn}
      onMouseLeave={this.handleHoverOut}
      onBodyClick={this.handleClick}
      onFooterClick={!s.stHover ? () => this.handleClick() : null}
      onContextMenu={this.handleContextClick}>
        {!p.tab.favIconUrl || (p.tab.domain && p.tab.domain === 'chrome') ?
        <div className={css(dynamicStyles.titleContainer)}>
          {p.tab.title.length > 0 && p.tab.title ? sanitize(p.tab.title) : p.tab.domain ? sanitize(p.tab.domain) : null}
        </div>
        : null}
      </Panel>
    );
  }
}

export default Tile;
