var socket = io();

var msgSender = document.getElementById('msgSender');
var username = '';
var roomname = '';
var online = true;
var alertWaiting = false;

var roomButton1 = '<button style=\'margin-top:8px;\' onclick=\'socket.emit("join", ["' // + username
var roomButton2 = '", "' // + room ID
var roomButton3 = '"]);closeNav();\'>' // + room name
var roomButton4 = '</button>'

function openMenu() {
  document.getElementById("other_stuff").style.right = '0';
}
function openUsers() {
  socket.emit('get users');
  document.getElementById("usersNav").style.right = "0";
}
function openSettings() {
  socket.emit('room settings');
  document.getElementById("settingsNav").style.right = "0";
}
function openRooms() {
  socket.emit('get rooms', username);
  document.getElementById("roomsNav").style.right = "0";
}
function openJoin() {
  document.getElementById("join_room").style.right = "0";
}
function closeNav() {
  document.getElementById("other_stuff").style.right = '-255px';
  document.getElementById("usersNav").style.right = "-255px";
  document.getElementById("settingsNav").style.right = "-255px";
  document.getElementById("roomsNav").style.right = "-255px";
  document.getElementById("join_room").style.right = "-255px";
  document.getElementById("msgSender").focus();
}

function changeIco(ref) {
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = './img/'+ref;
    document.getElementsByTagName('head')[0].appendChild(link);
}
// See if the page is visible (for favicon changing)
var vis = (function(){
    var stateKey, eventKey, keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function(c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

var rmCookie = function(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function joinRoom() {
  roomkey = document.getElementById('roomkey').value;
  socket.emit('add room', roomkey);
}

function sendMsg(msg) {
  if (msgSender.value.trim() !== '') {
    socket.emit('message', msgSender.value);
    msgSender.value = '';
  }
}

function logout() {
  rmCookie('username');
  rmCookie('key');
  window.location.replace("/index.html");
}

if (getCookie("username")) {
  username = getCookie("username");
  document.getElementById('username').innerHTML = username;
  password = getCookie("key");
  socket.emit('subauth', [username, password]);
} else {
  window.location.replace("/login.html");
}

changeIco('disconnect.png');
socket.emit('join', [username, 'lobby']);

// Callbacks
vis(function(){
    if (vis()) {changeIco('favicon.png');
                alertWaiting = false;}
    //changeIco(vis() ? '/static/favicon.png' : '/static/alert.png');
});

socket.on('user rooms', function(data){
  document.getElementById('rooms').innerHTML = ''
  for (i in data) {
    room = data[i];
    buttonPacket = roomButton1 + username + roomButton2 + room[0] + roomButton3 + room[1] + roomButton4 + "<br>";
    document.getElementById('rooms').innerHTML += buttonPacket;
    console.log(buttonPacket);
  }
});

socket.on('connected', function(data){
  roomname = data[0];
  roomid = data[1];
  pastmsgs = data[2];
  document.getElementById('msgs').innerHTML = '';
  for (i in pastmsgs) {
    $("#msgs").append("<div class='msg'>"+pastmsgs[i]+"</div>");
  }
  window.scrollTo(0,document.body.scrollHeight);
  console.log('connected to '+data);
  changeIco('favicon.png');
  document.getElementById('roomname').innerHTML = roomname;
  document.getElementById('roomid').innerHTML = roomid;
});

socket.on('err', function(data){
  document.getElementById('err').innerHTML = data;
});

socket.on('message', function(data){
  if (!alertWaiting) {
    if (!vis()) {changeIco('msg.png');}
  }
  start = "<div class='msg'>";
  if (data.includes('@'+username) || data.includes('@everyone')) {
    if (!vis()) {changeIco('alert.png');}
    alertWaiting = true;
    start = '<div class="alert msg">';
  }
  $("#msgs").append(start+data+"</div>");
  window.scrollTo(0,document.body.scrollHeight);
});

socket.on('return to whence you came', function(){
  window.location.replace("/login.html");
});

socket.on('users online', function(data){
  document.getElementById('users').innerHTML = '';
  for (i in data) {
    tempUser = data[i];
    $("#users").append("<a style='margin-top:4px;' href='javascript:void(0);' onclick='document.getElementById(\"msgSender\").value += \"@"+tempUser+"\";closeNav();'>"+tempUser+"</a><br>");
  }
});

socket.on('settings confirm', function(data){
  //console.log(data);
  document.getElementById("settings").innerHTML = ''
  if (data[0] == 1) {
    document.getElementById("settings").innerHTML += "<br><span>"+data[1]+"</span>";
  } else {
    // format settings, put them in settings
    dataPak = data[1];
    settingsPacket1 = "<br><span>Room:</span>"+roomname+"</span><br><br>";
    settingsPacket2 = "<span>Join Key:</span><br><br><span>"+dataPak+"</span><br><br><button onclick='socket.emit(\"reroll room key\");'>Reroll</button>";
    document.getElementById("settings").innerHTML += settingsPacket1 + settingsPacket2;
  }
});

socket.on("disconnect", function(reason){
  if (online) {
    online = false;
    $("#msgs").append("<div class='msg'>! Connection terminated. !</div>");
    window.scrollTo(0,document.body.scrollHeight);
  	changeIco('disconnect.png');
    document.getElementById('roomname').innerHTML = '-';
    document.getElementById('roomid').innerHTML = 'disconnected';
    console.log(reason);
  }
});
