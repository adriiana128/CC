const dgram = require("dgram");
const server = dgram.createSocket("udp4");
var fs = require("fs");

server.on("error", (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on("message", (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  fs.readFile(msg, function (err, data) {
    if (err) {
      server.send(
        "ERRO Ficheiro nao encontrado!",
        rinfo.port,
        "localhost",
        function (err, bytes) {
          if (err) throw err;
          console.log("Erro enviado para " + rinfo.port);
        }
      );

      return console.log(err);
    }

    var chunkSize = 1024;
    var splitfile = [];

    var stats = fs.statSync(msg);
    var filesize = stats.size;

    var chunks = Math.ceil(filesize / chunkSize, chunkSize);
    var chunk = 0;

    console.log("Number of chunks: " + chunks);
    while (chunk <= chunks) {
      var offset = chunk * chunkSize;
      console.log("current chunk..", chunk);
      console.log("offset...", chunk * chunkSize);
      console.log("file blob from offset...", offset);

      splitfile.push(data.slice(offset, offset + chunkSize));
      chunk++;
    }

    /*
    Envia o ficheiro que esta dividido dentro do split file
    */
    if (process.argv.length < 4) {
      console.log("Erro, deve inserir endereço e porta do HttpGw.");
      throw new Error()
    }
    else {
      const gwaddress = process.argv[2]
      const gwport = process.argv[3]
      server.send(splitfile, rinfo.port, gwaddress, function (err, bytes) {
        if (err) throw err;
        console.log("UDP file sent to " + gwaddress +":" + rinfo.port);
        console.log("File size: " + data.length);
      });
    }
  });
});

server.on("listening", () => {
  if (process.argv.length < 4) {
    console.log("Erro, deve inserir endereço e porta do HttpGw.");
    throw new Error()
  }
  else {
    const gwaddress = process.argv[2]
    const gwport = process.argv[3]
    
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);

    var files = fs.readdirSync('./').join('++');
    console.log(files);

    server.send(
      "PORT:" + address.port + '::::FILELIST:' + files,
      gwport,
      gwaddress
    );
  }
});

server.bind({
  //address: "localhost",
  port: 0,
  exclusive: true,
});
