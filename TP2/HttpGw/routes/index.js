var express = require("express");
var router = express.Router();

var udp = require("dgram");

var ffslist = []
var client = udp.createSocket("udp4");

client.on("listening", () => {
  const address = client.address();
  console.log(`UDP listening ${address.address}:${address.port}`);
});

client.bind({
  //address: "localhost",
  port: 16053,
  exclusive: true,
});

client.on("message", function (msg, info) {
  if (msg.toString().startsWith('PORT:')) {
    var split = msg.toString().split('::::')

    var port = split[0].substring(5)
    var filelist = split[1].substring(9).split('++')
    console.log(info)
    var newffs = {
      address: info.address,
      port: port,
      filelist: filelist
    }

    ffslist.push(newffs)

    console.log('Recebido novo ffs: Port:' + port + ', filelist:' + filelist);
  }
});


/* GET home page. */
router.get("/:filename", function (req, res, next) {
  var data1 = Buffer.from(req.params.filename);
  var ffsport = ''
  var address = ''

  ffslist.forEach(element => {
    console.log(element);
    if (element['filelist'].includes(req.params.filename)) {
      console.log('encontrado ffs com filename.' + element['port']);
      ffsport = element['port']
      address = element['address']
    }
  });

  if (ffsport == '') {
    res.end("Ficheiro nao existe em nenhum FFS")
  }

  /*
    Envia para FastFileServ o nome do ficheiro requerido
  */
  console.log(req.params)

  client.send(data1, ffsport, address, function (error) {
    if (error) {
      client.close();
    } else {

      console.log("Data sent !!!");
      console.log(req.res)
    }
  });

  /*
    Recebe a informação do FFS e envia para o cliente
  */
  client.on("message", function (msg, info) {
    if (msg.toString().startsWith('PORT:')) {
      console.log('Recebida info de ffs');
    }
    else {
      console.log("Data received from server : " + msg.toString());
      console.log(
        "Received %d bytes from %s:%d\n",
        msg.length,
        info.address,
        info.port
      );

      res.end(msg.toString());
    }
  });
});

module.exports = router;
