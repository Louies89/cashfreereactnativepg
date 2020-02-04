/**
 * Vrishab@Cashfree.com
 * 
 * v 3.1.0
 * 
 * 
 */
import React, { Component } from 'react';
// import { Modal, StyleSheet, TouchableOpacity} from 'react-native';
import { WebView } from 'react-native-webview';
import {View,/*Text,*/ Dimensions} from 'react-native';
import PropTypes from 'prop-types';
import {createForm, validateInput, paymentUrls} from './helper'
import base64 from 'base-64';


export default class CashfreePG1 extends Component{
  static propTypes = {
    appId: PropTypes.string.isRequired,
    orderId: PropTypes.string.isRequired,
    orderAmount: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
    customerEmail : PropTypes.string.isRequired,
    customerPhone : PropTypes.string.isRequired,
  }

  constructor(props){
    super(props);
    this.state = {
      modalVisible: true,
      //if error occurs can retry gets set to true so the last orderId can be passed again
      canRetry: false,
    }

    //bind all necessary functions
    this.generatePaymentUrl = this.generatePaymentUrl.bind(this);
    this.createRequiredKeys = this.createRequiredKeys.bind(this);
    this.validateCallBack = this.validateCallBack.bind(this);
    this.cleanProps = this.cleanProps.bind(this);
    this.verifyUPI = this.verifyUPI.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.communicateError = this.communicateError.bind(this);
    this.displayModal = this.displayModal.bind(this);
  }

  componentDidUpdate(prevprops, prevstate){
    if(prevprops.orderId !== this.props.orderId){
      this.setState({modalVisible: true, canRetry: false});
      return;
    }
    else if (this.state.canRetry){
      if (JSON.stringify(this.props) !== JSON.stringify(prevprops)) this.setState({modalVisible: true, canRetry: false});
      return;
    }
  }


  closeModal(result){
    const {callback} = this.props;
    if((typeof result)=== 'undefined'){
      //the assmption is that if closeModal is called without passisng a result obj it has been called from the close button, which is user cancelled.
      result =JSON.stringify({
        txStatus: 'CANCELLED',
        txMsg: 'Transaction incomplete/cancelled app side or incorrect data passed, please check your server logs',
      });
    }

    this.setState({modalVisible: false},()=>{
      callback(result);
    });
  }

  generatePaymentUrl(){
    try{
      let {env} = this.props;
      if(!env) env = "prod";
      
      const pUrl = paymentUrls[env];
      
      if(!pUrl) throw {name: "validatingInputError", message: "incorrect enviornment"}

      return pUrl;
    }
    catch(err){
      console.log("err in generating payment url");
      console.log(err);
      throw err;
    }
  }

  verifyUPI(){
    const {upi_vpa, upiMode} = this.props;

    if(!(upi_vpa?!upiMode:upiMode))
    {
      throw {name: "validatingInputError", message: "incorrect upi params"};
    }
  }

  createRequiredKeys(){
    try{
      const {paymentOption} = this.props;
      let requiredKeys = ['appId','orderId','orderAmount','customerPhone','customerEmail']
      
      if(!paymentOption) return requiredKeys;
    
      switch(paymentOption){
        case "nb":
        case "wallet": 
        case "paylater": {
          requiredKeys.push('paymentCode');
          break;
        }

        case "card": {
          requiredKeys.push('card_number','card_holder','card_cvv','card_expiryMonth','card_expiryYear');
          break;
        }

        case "savedCard":{
          requiredKeys.push('card_id', 'card_cvv');
          break;
        }

        case "upi": {
          this.verifyUPI();
          break;
        }

        case "emi": {
          requiredKeys.push("paymentCode");
          break;
        }

        case "paypal":{
          break;
        }

        default: {
          throw({name: "validatingInputError", message: "invalid payment method"});
        }
    
      }
      return requiredKeys
    }
    catch(err){
      console.log("err in create required keys");
      console.log(err);
      //push error up
      throw err;
    }
 
  }

  validateCallBack(){
    const {callback} = this.props;
    if( typeof callback !== 'function'){
      throw {name: "validatingInputError",message: "callback is not of type function"}
    }
  }

  cleanProps(){
    let p = {...this.props};
    delete p.env;
    delete p.callback;
    return p;
  }

  displayModal(htmlDoc){
    return(
      // <Modal visible={this.state.modalVisible}>
        <View style={{flex:1/*, marginTop:30*/}}>
          {/* <View style={styles.topbar}>
              <TouchableOpacity onPress={()=>{this.closeModal()}}>
                <Text style={this.state.canGoBack ? styles.topbarText : styles.topbarTextDisabled}>Go Back</Text>
              </TouchableOpacity>
          </View> */}
          <WebView
            ref={webview => {
                  this.myWebView = webview;
            }}     
            javaScriptEnabled = {true} 
            domStorageEnabled={true}  
            originWhitelist = {['*']}

            source={{html:htmlDoc}}
          
            onNavigationStateChange={(event)=>{
              if(event.url.includes("react?val=")){
                const token = event.url.split("react?val=")[1];
                const decodedToken = base64.decode(token);
                this.closeModal(decodedToken);
              }
            }}
            style={{marginTop :1,width: Dimensions.get('window').width}}
            onError={()=>{
              this.props.onError()
            }}
            />
        </View>
      // </Modal>
    );
  }

  communicateError(err){
    const result = JSON.stringify({
      txStatus: "FAILED",
      txMsg: err,
    });
    this.setState({modalVisible:false,canRetry: true}, this.props.callback(result))
  }

  render(){
    if(!this.state.modalVisible){
      return null;
    }
    try{
      const paymentUrl = this.generatePaymentUrl();
      const requiredKeys = this.createRequiredKeys();
      validateInput(requiredKeys, this.props);
      this.validateCallBack();
      const form = createForm(paymentUrl, this.cleanProps());
      return(this.displayModal(form));
    }
    catch(err)
    {
      console.log("err caught in cashfreepg render");
      console.log(err);
      this.communicateError(err);
      return null;
    }
  }


}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     // paddingTop: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   topbar: {
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   topbarTextDisabled: {
//     color: 'white'
//   }
// });
