import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import _ from 'lodash';
import onClickOutside from 'react-onclickoutside';
import ReactTooltip from 'react-tooltip';
import themeStore from './stores/theme';
import {tryFn} from './utils';

export class Btn extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      theme: null,
      hover: false
    }
    this.connectId = themeStore.connect('*', (e) => this.themeChange(e));
    autoBind(this);
  }
  componentDidMount(){
    let selectedTheme = themeStore.getSelectedTheme();
    this.setState({theme: selectedTheme});
    this.themeChange({theme: selectedTheme});
  }
  componentDidUpdate(pP, pS){
    if (pS.hover !== this.state.hover && !this.state.hover) {
      ReactTooltip.hide();
    }
  }
  componentWillUnmount(){
    themeStore.disconnect(this.connectId);
    tryFn(() => this.ref.style.display = 'none');
  }
  themeChange(e){
    if (e.theme) {
      this.setState({theme: e.theme});
      _.defer(()=>ReactTooltip.rebuild());
    }
  }
  handleHoverIn(){
    this.setState({hover: true});
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter();
    }
  }
  handleHoverOut(){
    this.setState({hover: false});
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave();
    }
  }
  getRef(ref) {
    this.ref = ref;
  }
  render() {
    let p = this.props;
    let s = this.state;
    let style = {};
    if (s.theme) {
      if (p.className === 'ntg-btn' || p.className === 'ntg-top-btn') {
        style = {
          backgroundColor: s.hover ? s.theme.darkBtnBgHover : s.theme.darkBtnBg,
          color: s.theme.darkBtnText,
          textShadow: `1px 1px ${s.theme.darkBtnTextShadow}`
        };
      } else {
        style = {
          backgroundColor: s.hover ? s.theme.lightBtnBgHover : s.theme.lightBtnBg,
          color: s.theme.lightBtnText,
          textShadow: `1px 1px ${s.theme.lightBtnTextShadow}`
        };
      }
      _.assignIn(style, {
        boxShadow: `${s.theme.tileShadow} 1px 1px 5px -1px`,
        opacity: '1'
      });
      _.assignIn(style, _.cloneDeep(p.style));
      let faStyle = {
        paddingRight: !p.noIconPadding ? '6px' : null
      };
      _.assignIn(faStyle, _.cloneDeep(p.faStyle));
      return (
        <button
        data-tip={p['data-tip'] ? `<div style="max-width: 350px;">${p['data-tip']}</div>` : null}
        ref={this.getRef}
        style={style}
        onMouseEnter={this.handleHoverIn}
        onMouseLeave={this.handleHoverOut}
        onClick={p.onClick}
        id={p.id}
        className={p.className}>
          <div className="btn-label">
            {p.fa || p.icon ?
            <i
            className={`${p.fa ? 'fa fa-'+p.fa : ''}${p.icon ? ' icon-'+p.icon : ''}`}
            style={faStyle} /> : null}
            {p.fa ? ' ' : null}
            {p.children}
          </div>
        </button>
      );
    } else {
      return null;
    }
  }
}

Btn.defaultProps = {
  style: {},
  faStyle: {},
  noIconPadding: false
};

export class Col extends React.Component {
  static propTypes = {
    size: PropTypes.string.isRequired
  };
  constructor(props){
    super(props);
  }
  render(){
    let p = this.props;
    return (
      <div
      data-tip={p['data-tip'] ? `<div style="max-width: 350px;">${p['data-tip']}</div>` : null}
      onContextMenu={p.onContextMenu}
      onDragEnter={p.onDragEnter}
      onMouseEnter={p.onMouseEnter}
      onMouseLeave={p.onMouseLeave}
      onClick={p.onClick}
      style={p.style}
      id={p.id}
      className={p.className ? 'col-xs-'+p.size+' '+p.className : 'col-xs-'+p.size}>
        {p.children}
      </div>
    )
  }
}

export class Row extends React.Component {
  static propTypes = {
    fluid: PropTypes.bool,
  };
  static defaultProps = {
    fluid: false,
  };
  constructor(props){
    super(props);
  }
  render(){
    let p = this.props;
    return (
      <div
      data-tip={p['data-tip'] ? `<div style="max-width: 350px;">${p['data-tip']}</div>` : null}
      onContextMenu={p.onContextMenu}
      onDragEnter={p.onDragEnter}
      onMouseEnter={p.onMouseEnter}
      onMouseLeave={p.onMouseLeave}
      onClick={p.onClick}
      style={p.style}
      id={p.id}
      className={p.fluid ? p.className ? 'row-fluid '+p.className : 'row-fluid' : p.className ? 'row '+p.className : 'row'}>
        {p.children}
      </div>
    );
  }
}

export class Container extends React.Component {
  static propTypes = {
    fluid: PropTypes.bool
  };
  static defaultProps = {
    fluid: false
  };
  constructor(props){
    super(props);
  }
  render() {
    let p = this.props;
    return (
      <div
      data-tip={p['data-tip'] ? `<div style="max-width: 350px;">${p['data-tip']}</div>` : null}
      onContextMenu={p.onContextMenu} onDragEnter={p.onDragEnter}
      onMouseEnter={p.onMouseEnter} onMouseLeave={p.onMouseLeave}
      onClick={p.onClick}
      style={p.style}
      id={p.id}
      className={p.fluid ? p.className ? 'container-fluid '+p.className : 'container-fluid' : p.className ? 'container '+p.className : 'container'}>
        {p.children}
      </div>
    );
  }
}

export class Panel extends React.Component {
  constructor(props){
    super(props);
  }
  render(){
    let p = this.props;
    let defaultStyle = {};
    if (p.content) {
      _.assignIn(defaultStyle, {
        boxShadow: p.type === 'default' ? '0 1px 3px rgba(0, 0, 0, 0), 0 1px 2px rgba(0, 0, 0, 0)' : 'initial'
      });
    }
    _.assignIn(defaultStyle, _.cloneDeep(p.style));
    return (
      <div
      draggable={p.draggable}
      onDragEnd={p.onDragEnd}
      onDragStart={p.onDragStart}
      onDragOver={p.onDragOver}
      className={`panel panel-${p.type}${p.className ? ' '+p.className : ''}`}
      style={defaultStyle}
      onMouseEnter={p.onMouseEnter}
      onMouseLeave={p.onMouseLeave}
      onContextMenu={p.onContextMenu}>
        {p.header ?
        <div className="panel-heading" style={p.headingStyle}>
          {p.header}
        </div> : null}

        {!p.noBody ?
        <div className="panel-body" style={p.bodyStyle} onClick={p.onBodyClick}>
          {p.children}
        </div> : null}
        {p.noBody ? p.children : null}
        {p.footerLeft || p.footerRight ?
        <div className="panel-footer panel-footer-transparent" style={p.footerStyle} onClick={p.onFooterClick}>
          <div className="heading-elements">
            {p.footerLeft}
            {p.footerRight ?
            <div className="pull-right">
              {p.footerRight}
            </div> : null}
          </div>
        </div> : null}
      </div>
    );
  }
}

Panel.defaultProps = {
  className: null,
  style: null,
  bodyStyle: null,
  header: null,
  footerLeft: null,
  footerRight: null,
  noBody: false,
  type: 'flat',
  content: false
};

export class ModalOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fadeIn: false
    }
    autoBind(this);
  }
  componentDidMount(){
    _.defer(()=>{
      this.setState({fadeIn: true});
    });
  }
  componentWillUnmount(){
    this.setState({fadeIn: false});
  }
  handleCloseClick(){
    this.setState({fadeIn: false});
    _.defer(()=>this.props.onClose());
  }
  render(){
    let s = this.state;
    let p = this.props;
    let overlayStyle = {display: 'block', paddingRight: '15px', transition: p.animations ? 'top 0.2s' : 'initial'};
    overlayStyle = _.assignIn(overlayStyle, p.overlayStyle);
    return (
      <div className={`modal-tm5k modal fade${s.fadeIn ? ' in' : ''}`} style={overlayStyle}>
        <ModalDefault
        onClose={this.handleCloseClick}
        header={p.header}
        size={p.size}
        heightOffset={p.heightOffset}
        closeBtnStyle={p.closeBtnStyle}
        headerComponent={p.headerComponent}
        footerComponent={p.footerComponent}
        clickOutside={p.clickOutside}
        headerStyle={p.headerStyle}
        contentStyle={p.contentStyle}
        bodyStyle={p.bodyStyle}
        dialogStyle={p.dialogStyle}
        footerStyle={p.footerStyle}
        animations={p.animations}>
        {p.children}
        </ModalDefault>
        <div className={`modal-backdrop fade${s.fadeIn ? ' in' : ''}`} style={p.backdropStyle} />
      </div>
    );
  }
}

ModalOverlay.defaultProps = {
  onClose: ()=>{return;},
  header: '',
  size: null,
  footerComponent: null,
  clickOutside: false,
  bodyStyle: {}
};

export class ModalDefault extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }
  handleClickOutside(){
    if (this.props.clickOutside) {
      this.props.onClose();
    }
  }
  render(){
    let p = this.props;
    let heightOffset = p.heightOffset ? p.heightOffset : p.footerComponent ? 200 : 140;
    let bodyStyle = {maxHeight: `${window.innerHeight - heightOffset}px`, overflowY: 'auto', transition: p.animations ? 'max-height 0.2s' : 'initial'};
    bodyStyle = _.assignIn(bodyStyle, _.cloneDeep(p.bodyStyle));
    let headerStyle = {paddingTop: '0px'};
    headerStyle = _.assignIn(headerStyle, _.cloneDeep(p.headerStyle));
    return (
      <div className={`modal-dialog${p.size ? ' modal-'+p.size : ''}`} style={p.dialogStyle}>
        <div className="modal-content" style={p.contentStyle}>
          <div className="modal-header bg-blue" style={headerStyle}>
            <button type="button" className="close icon-cross2" onClick={p.onClose} style={p.closeBtnStyle} />
            <div className="col-xs-10">
              <div className="media-left media-middle" style={{position: 'relative', top: '8px', fontSize: '16px'}}>
                {p.header}
              </div>
              <div className="media-right">
                {p.headerComponent}
              </div>
            </div>
          </div>

          <div className="modal-body" style={bodyStyle}>
            {p.children}
          </div>

          {p.footerComponent ?
          <div className="modal-footer" style={p.footerStyle}>
            {p.footerComponent}
          </div> : null}
        </div>
      </div>
    );
  }
}

ModalDefault = onClickOutside(ModalDefault);

export class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      active: 0
    }
    autoBind(this);
  }
  componentDidMount(){
    this.setState({active: this.props.initActiveOption});
  }
  handleTabClick(option, i){
    this.props.onClick(option);
    this.setState({active: i});
  }
  render(){
    let p = this.props;
    let s = this.state;
    return (
      <div className="tabbable" style={p.style}>
        <ul className="nav nav-tabs nav-tabs-highlight nav-justified">
          {p.options.map((option, i)=>{
            let active = option.label.toLowerCase() === p.settings;
            let tabStyle = {
              cursor: 'pointer',
              borderTopColor: active ? p.borderTopColor : 'rgba(255, 255, 255, 0)',
              borderBottomColor: active ? 'rgba(255, 255, 255, 0)' : p.borderTopColor,
              borderLeftColor: active ? p.borderTopColor : p.borderLeftRightColor,
              borderRightColor: active ? p.borderTopColor : p.borderLeftRightColor
            };
            tabStyle = _.assignIn(tabStyle, _.cloneDeep(p.tabStyle));
            return (
              <li key={i} className={s.active === i ? 'active' : ''}>
                <a style={tabStyle} data-toggle="tab" className="legitRipple" onClick={()=>this.handleTabClick(option, i)}>{option.label}</a>
              </li>
            );
          })}
        </ul>

        {p.children ?
        <div className="tab-content">
          {p.children}
        </div> : null}
      </div>
    );
  }
}

Tabs.defaultProps = {
  options: []
};

export class Context extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }
  handleClickOutside(){
    this.props.onClickOutside();
  }
  render(){
    let p = this.props;
    return (
      <ul
      className="dropdown-menu dropdown-menu-xs"
      style={{
        userSelect: 'none',
        display: 'block',
        position: 'relative',
        width: '100%',
        marginTop: '0',
        float: 'none',
        padding: '1px',
        borderRadius: '1px',
        backgroundColor: p.theme.settingsBg
      }}>
        {p.options ? p.options.map((option, i)=>{
          if (option.divider) {
            return <li key={i} className="divider" />;
          }
          if (option.argument) {
            if (option.hasOwnProperty('switch')) {
              return (
                <li key={i} className="checkbox checkbox-switchery switchery-xs">
                  <label style={{paddingLeft: '47px', paddingTop: '6px', paddingBottom: '6px', color: p.theme.bodyText}} onClick={option.onClick}>
                    <span
                    className="switchery switchery-default"
                    style={{
                      left: '8px',
                      backgroundColor: option.switch ? p.theme.darkBtnBg : 'rgba(255, 255, 255, 0)',
                      borderColor: option.switch ? p.theme.textFieldBorder : p.theme.darkBtnBg,
                      boxShadow: `${option.switch ? p.theme.textFieldBorder : p.theme.darkBtnBg} 0px 0px 0px 8px inset`,
                      transition: p.animations ? 'border 0.4s, box-shadow 0.4s, background-color 1.2s' : 'initial',
                    }}>
                      <small style={{left: option.switch ? '14px' : '0px', transition: p.animations ? 'background-color 0.4s, left 0.2s' : 'initial', backgroundColor: option.switch ? p.theme.darkBtnText : p.theme.bodyText}} />
                    </span>
                     {option.label}
                  </label>
                </li>
              );
            } else {
              return (
                <li key={i}>
                  <a
                  style={{cursor: 'pointer', color: p.theme.bodyText}}
                  onClick={option.onClick}>
                    <i style={{color: p.theme.bodyText}} className={option.icon} />
                    {option.label}
                  </a>
                </li>
              );
            }
          } else {
            return null;
          }
        }) : null}
      </ul>
    );
  }
}

Context.defaultProps = {
  options: null
};

Context = onClickOutside(Context);