/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var socket = io();

var templates = {
    message : _.template($("#t_chat-stream-message").html()),
    action : _.template($("#t_chat-stream-action").html()),
    join : _.template($("#t_chat-stream-join").html()),
    part : _.template($("#t_chat-stream-part").html()),
    kick : _.template($("#t_chat-stream-kick").html()),
    user : _.template($("#t_userlist-user").html())
}

socket.on('chat-event', function(data){
    console.log(data);
    switch(data.type){
        case "message":
            $('#chat-log').append(templates.message(data));
            break;
        case "action":
            $('#chat-log').append(templates.action(data));
            break;
        case "join":
            $('#chat-log').append(templates.join(data));
            break;
        case "part":
            $('#chat-log').append(templates.part(data));
            break;
        case "kick":
            $('#chat-log').append(templates.kick(data));
            break;
        default:
            console.log(data)
    }
});

socket.on('meta-users', function(data){
    console.log(data);
    for(var i = 0, l = Object.keys(data).length; i<l; i++){
        var userData = {
            "nick" : Object.keys(data)[i],
            "rank" : data[Object.keys(data)[i]]
        }
        console.log(userData);
        $('#user-list').append(templates.user(userData));
    }
});