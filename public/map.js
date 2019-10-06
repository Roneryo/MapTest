const socket = io();
//Variables para depurar los marcadores y areas sombreadas
users = {};
areas = {};
user = undefined;
//Variable que me da el mapa
var map = L.map("map").fitWorld();
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);
//Ordeno a la camara del mapa que enfoque exatamente donde esta ubicado el usuario y
//Le paso el zoom
map.locate({
    setView: true,
    maxZoom: 16,
    enableHighAccuracy: true,
    watch: true
});

//Esta es una funcion predeterminada que trae leafLetjs que
//esta escucha la posicion de usuario. Al conseguirla ejecuta una funcion
map.on("locationfound", onLocationFound);

//Esta es la funcion que se ejecuta al conseguir
//La posicion del usuario
function onLocationFound(e) {
    //Al saber la ubicacion emito una llamada al servidor
    //Donde le paso las coordenadas en la cual el usuario esta ubicado.
    var coords = e.latlng;
    console.log(coords);

    if (
        Object.keys(users).length > 0 &&
        users[user]._latlng.lat !== e.latlng.lat &&
        users[user]._latlng.lng !== e.latlng.lat
    ) {
        console.log(users[user]._latlng.lat);
        console.log(e.latlng.lat);
        users[user].setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
        // areas[user].setRadius(data[user])
        console.log("Debo estar actualizando este marcador!");
        socket.emit('update',user);
    } else {
        //Dibujar primer y nueva posicion de usuario
        socket.emit(
            "locationfound",
            {
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                radius: e.accuracy,
                currentNick: user
            },
            () => {
                console.log("ola");
            }
        );
    }
    //cambiar la posicuion de un usaurio en tiempo real
}

//Al mismo momento le solicito al servidor los usuarios que
//Ya tienen una ubicacion en el mapa
socket.on("draw", data => {
    //Si es la primera vez que el usuario esta ingresando
    //Procedera a pintar todos los usuarios
    //Que se encuentran registrados
    if (Object.keys(users).length === 0) {
        var keys = Object.keys(data);
        var last = keys[keys.length - 1];
        for (dato in data) {
            if (data[dato].online === true) {
                console.log("datos ", data);
                users[dato] = L.marker(data[dato].coords /*,{draggable:true}*/)
                    .bindPopup(
                        "Estas a " + data[dato].radius + " metros de esta ubicacion"
                    )
                    .openPopup()
                    .addTo(map);
                areas[dato] = L.circle(data[dato].coords, data[dato].radius).addTo(map);
                datos = users;
                if (Object.keys(data).length === 1) {
                    user = 0;
                } else if (dato === last) {
                    user = last;
                    console.log("last", user);
                }
            }
        }
    }
    //Si ya este lleva tiempo en la ventana
    //Solo procedera a pintar el usuario nuevo y
    //lo registrara en el objeto "users"
    else {
        var keys = Object.keys(data);
        var last = keys[keys.length - 1];
        console.log(`Keys ${keys}// Last: ${last}`);
        console.log(datos);

        users[last] = L.marker(data[last].coords, {
            /*draggable:true*/
        })
            .bindPopup("Estas a " + data[last].radius + " metros de esta ubicacion")
            .openPopup()
            .addTo(map);
        areas[last] = L.circle(data[last].coords, data[last].radius).addTo(map);
        datos = users;
        if (user == undefined) {
            user = last;
        }
    }
});
socket.on('change',data =>{
  console.log("Supuestamente actualizando la posicion de ",data);  
});
socket.on("disconnect", data => {
    console.log(data);
    users[data].remove();
    areas[data].remove();
});