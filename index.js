const express = require("express");
var http = require("http").Server(express());
const app = express();
var nicknames = {}; //Guardo la informacion de cada usuario ingresado
var cont = 0; //Creo un identificador con cada usuario que ingresa
//settings
app.set("port", process.env.PORT || 3000);

//static files
app.use(express.static("public"));

//start the server
const server = app.listen(app.get("port"), () => {
    console.log("server on port", app.get("port"));
});
const SocketIO = require("socket.io")(http);
const io = SocketIO.listen(server);

io.on("connection", socket => {
    cleanup();
    console.log("new connection", socket.id);
    socket.on("locationfound", (data, callback) => {
        if (nicknames.hasOwnProperty(data)) {
            callback(false);
        } else {
            callback(true);
            if(data.currentNick===undefined){
            socket.nickname = cont;
            cont++; //Incremento en 1 a 1 cada usuario y los elimino en el frontend
            nicknames[socket.nickname] = {
                online: true,
                coords: [data.lat, data.lng],
                radius: data.radius
            }; //Then we put an object with a variable online
            console.log("user connected: " + socket.nickname);
            }
        }
        console.log(nicknames);

        console.log("Se esta moviendo el usuario",data.currentNick);
        if(data.currentNick===undefined){
            io.sockets.emit("draw", nicknames);
        }
        else{
            io.sockets.emit('change',{
                user  :data.currentNick,
                cords :{lat:data.lat,lng:data.lng},
                radius:data.radius
            });
        }
    });
    socket.on('update',function(data){
        // console.log("change me dio esto: ",data);
        console.log('usuario: ',data.user);
        nicknames[data.user].coords[0] = data.cords.lat;
        nicknames[data.user].coords[1] = data.cords.lng;
        nicknames[data.user].radius    = data.radius;
        // console.log('y le estoy dando esto: ',nicknames);
        io.sockets.emit('update',nicknames);
    });
    socket.on("disconnect", function () {
        console.log("user disconnected:" + socket.nickname);
        if (!socket.nickname) return;
        nicknames[socket.nickname].online = false; //We dont splie nickname from array but change online state to false
        io.sockets.emit("disconnect", socket.nickname);
    });
});
