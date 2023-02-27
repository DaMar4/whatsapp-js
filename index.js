//HEAD
const {Client, MessageMedia, LocalAuth} = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const mysql = require("mysql")
var inv=""
var leav=""
const conexion_db = mysql.createConnection({
    host:"localhost",
    database:"usuarios_db",
    user:"root",
    password:""
})
const client = new Client({
    authStrategy:new LocalAuth({
        clientID: "client-one"
    })
})
client.on("authenticated",(session)=>{
    conexion_db.connect(function(error){
        if(error) throw error;
        console.log("conexión exitosa")
    })
    console.log("listo")
})

client.on("qr",(qr)=>{
    qrcode.generate(qr,{small:true})
})
client.initialize()
client.on("group_join",async (x)=>{
    inv=x.id.participant
})
client.on("group_leave",async (y)=>{
    leav=y.id.participant
})
//FUNCIONES
client.on("message",async message=>{
    if(await(await message.getChat()).isGroup){
        client.getChats().then((chats)=>{
            const mi_grupo = chats.find((chat)=>chat.name==="Ya es 2023 banda 😎")
            //let id_part=message.id.participant
            if(inv!=""){
                mi_grupo.sendMessage(`Hola ${inv} bienvenido a nuestro grupo, sientete como en casa 😃🤝`)
                inv=""
            }
            if(leav!=""){
                //mi_grupo.sendMessage(`${leav} ha abandonado el grupo 😓, espermos que regrese pronto 😁`)
                leav=""
            }
            let mensaje = message.body
            switch(mensaje){
                case "/report":
                    if(message.hasQuotedMsg){
                        let id_reportado = message._data.quotedParticipant
                        conexion_db.query("select * from numeros_usuarios where numero='"+id_reportado+"'",function(error,results,fields){
                            if(error) throw error;
                            if(results==""){
                                console.log("el numero no esta registrado")
                                conexion_db.query("insert into numeros_usuarios(numero,reportes)values('"+id_reportado+"',1)")
                                console.log("el numero ah sido registrado con exito")
                                console.log(`el usuario ${id_reportado} ah sido reportado`)
                                mi_grupo.sendMessage(`${id_reportado} has sido reportado`)
                                //conexion_db.end()
                            }
                            else{
                                
                                if(results[0].reportes<2){
                                    let reporte=results[0].reportes+1
                                    conexion_db.query("UPDATE numeros_usuarios SET reportes = "+reporte+" WHERE numero = '"+id_reportado+"'")
                                    console.log(`el usuario ${id_reportado} ah sido reportado`)
                                    mi_grupo.sendMessage(`${id_reportado} has sido reportado`)
                                }
                                else{
                                    if(results[0].reportes===2){
                                        console.log(`este numero ${id_reportado} tiene 3 reportes, ha sido baneado`)
                                        mi_grupo.sendMessage(`el numero ${id_reportado} tiene 3 reportes y ha sido baneado`)
                                        mi_grupo.removeParticipants([id_reportado])
                                        conexion_db.query("UPDATE numeros_usuarios SET reportes = 0 WHERE numero = '"+id_reportado+"'")
                                    }
                                }
                            }
                        })
                    }
                    break
                case "/cerrar":
                    const part = message.getChat().then((p)=>{
                        for(let i of p.participants){
                            if(i.isAdmin){
                                if(message.author == i.id._serialized){
                                    console.log("eres admin")
                                    mi_grupo.setMessagesAdminsOnly()
                                    mi_grupo.sendMessage("Buenas noches a todos,que descansen 🌙😴💤")
                                }
                            }else{
                                if(!i.isAdmin){
                                    if(message.author == i.id._serialized){
                                        mi_grupo.sendMessage("esta funcion esta disponible solo para administradores.")
                                    }
                                }
                            }
                        }
                    })
                    break
                case "/abrir":
                    const part2 = message.getChat().then((p)=>{
                        for(let i of p.participants){
                            if(i.isAdmin){
                                if(message.author == i.id._serialized){
                                    console.log("eres admin")
                                    mi_grupo.setMessagesAdminsOnly(0)
                                    mi_grupo.sendMessage("Hola buenos dias a todos, que tengan excelente dia ☀🤩🤝")
                                }
                            }else{
                                if(!i.isAdmin){
                                    if(message.author == i.id._serialized){
                                        mi_grupo.sendMessage("esta funcion esta disponible solo para administradores.")
                                    }
                                }
                            }
                        }
                    })
                    break
            }
        })
    }
    else{
        console.log("este chat no es un grupo grupo")
    }
})