/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var socket = io();

var templates = {
    message : _.template($("#t_chat-stream-message").html()),
    action : _.template($("#t_chat-stream-action").html())
}

socket.on('chat-event', function(data){
    console.log(data);
    $('#chat-log').append(templates.message(data));
});

socket.on('chat-live-action', function(data){
    $('#chat-log').append(templates.action(data));
});

socket.on('chat-live-dance', function(){
    $('#chat-log').append($('<li>').html("dance"));
});

socket.on('chat-live-part', function(data){
    $('#chat-log').append($('<li>').html("<span class='username'>"+data.who+"</span> has <span class='verb'>left</span>."));
});

socket.on('chat-live-join', function(who){
    $('#chat-log').append($('<li>').html("<span class='username'>"+who+"</span> has <span class='verb'>joined</span>."));
});

socket.on('chat-live-kick', function(data){
    $('#chat-log').append($('<li>').html("<span class='username'>"+data.who+"</span> was <span class='verb'>kicked</span> by <span>"+data.by+"</span>"));
});