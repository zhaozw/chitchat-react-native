import React, { Component } from 'react';
import { Container, Header, Content, List,Title,Icon, ListItem,Segment,Button, Left, Body, 
  Right, Thumbnail, Text,Badge } from 'native-base';
import {  AppRegistry, StyleSheet,ListView,ToastAndroid} from 'react-native';
import firebaseApp from './Firebase';
import MessageScreen from './MessageScreen';
var PushNotification = require('react-native-push-notification');
var totalUnread;
PushNotification.configure({
   // (optional) Called when Token is generated (iOS and Android)
      onRegister: function(token) {
          console.log( 'TOKEN:', token );
      },
  
      // (required) Called when a remote or local notification is opened or received
      onNotification: function(notification) {
          console.log( 'NOTIFICATION:', notification );
      },
    
      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: false,
  
      /**
        * (optional) default: true
        * - Specified if permissions (ios) and token (android and ios) will requested or not,
        * - if not, you must call PushNotificationsHandler.requestPermissions() later
        */
      requestPermissions: true,
  });


/////////////////////////////////////////////////////////////////////////////////////  
export default class ChatScreen extends Component {
 
  static navigationOptions = {
    title: 'Chats',
    header:null,
 };
 constructor(props) {
  super(props);
  this.state = {     
    errors: [],
    count:0,
    dataSource: new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    })
  }
  var Ukey = firebaseApp.auth().currentUser.uid;
  this.userRef =firebaseApp.database().ref().child('user');
  this.ChatwithRef =firebaseApp.database().ref('user/'+Ukey).child('ChatWith');
}

pushNotify(subT,bigT,mCount,groupT){
  PushNotification.localNotification({
    /* Android Only Properties */
    id: '0', // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
    ticker: "ChitChat", // (optional)
    autoCancel: true, // (optional) default: true
    largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
    smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
    bigText: bigT,
    subText: "New Messages", // (optional) default: none
    color: "#075e54", // (optional) default: system default
    vibrate: false, // (optional) default: true
    vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
    tag: 'some_tag', // (optional) add tag to message
    group: 'RNS', // (optional) add group to message
    ongoing: false, // (optional) set whether this is an "ongoing" notification

    /* iOS and Android properties */
    title: subT, // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
    message: bigT, // (required)
    playSound: false, // (optional) default: true
    soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
    number: mCount, // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
     // (Android only) Repeating interval. Could be one of `week`, `day`, `hour`, `minute, `time`. If specified as time, it should be accompanied by one more parameter 'repeatTime` which should the number of milliseconds between each interval
    // actions: '["Yes", "No"]',  // (Android only) See the doc for notification actions to know more
});
}

listenForItems(userRef,ChatwithRef) {

  var chatwith=[]; 
  ChatwithRef.on('value', (snap) => {   
    snap.forEach((child) => { 
      chatwith.push(child.val().ID );      
    });
  });   

  userRef.on('value', (snap) => {    
    var user = [];
    snap.forEach((child) => {
    
        if(chatwith.includes(child.val().UID))
        {
          user.push({
            name: child.val().Name,
            url: child.val().ImageURL,
            phone:child.val().Phone_No,
            uid:child.val().UID,
            _key: child.key,
            status:child.val().status,
            count:0     
          });
        }
     
    });
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(user.reverse()),     
    });
  });
}

componentDidMount() {
  this.listenForItems(this.userRef,this.ChatwithRef);
  PushNotification.cancelAllLocalNotifications()
}

_renderItem(Userdata) {
  const { navigate } = this.props.navigation;
  Userdata.count = 0;
  var opac=0;
  var lastMsg='';
  var Ukey = firebaseApp.auth().currentUser.uid;
  let refLocal=firebaseApp.database().ref('Unread/'+Ukey+'/'+Userdata._key);
  refLocal.on('value', (snap) => { 
    Userdata.count = 0;   
    if(snap.exists()){
      snap.forEach((child) => {
      Userdata.count=Userdata.count+1;
      lastMsg=child.val().text;
    });
    opac=1;
    if(Userdata.count>0){
      subT='You have '+ Userdata.count+ ' unread msg from '+Userdata.name;
      bigT=lastMsg;
      Mcount=Userdata.count;
      groupT=Userdata.name;
      this.pushNotify(subT,bigT,Mcount,groupT);
    }
    // ToastAndroid.showWithGravity('You have '+ Userdata.count+ ' unread msg from '+Userdata.name, ToastAndroid.SHORT, ToastAndroid.BOTTOM);
  } else {
    Userdata.count = 0;
    opac=0;
  }
  totalUnread+=Userdata.count;
  });

     return (      
      <ListItem avatar Userdata={Userdata} style={{margin:3}} onPress={() => navigate('Message',{ Rid:Userdata._key, username: Userdata.name,status:Userdata.status,phone:Userdata.phone,url:Userdata.url })}>
      <Left>
        <Thumbnail source={{ uri:Userdata.url  }} />
      </Left><Body>
        <Text>{Userdata.name}</Text></Body>
        <Badge style={{marginTop:15,margin:5,backgroundColor:'#075e54',opacity:opac}}>
            <Text>{Userdata.count}</Text>
          </Badge>
      </ListItem>
    );  
}

render() {

    return (
      <Container>  
        <Content>
        <ListView dataSource={this.state.dataSource}
renderRow={this._renderItem.bind(this)} enableEmptySections={true} style={styles.listview}>                      
          </ListView>  
        </Content>
      </Container>
    );
  }
}
var styles = StyleSheet.create({
  
  title: {
    fontWeight: 'bold',fontFamily: "vincHand",
    fontSize: 30,
    textAlign: "center",
    marginTop:25,    
  }, 
});

