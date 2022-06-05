const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
  secretAccessKey: "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",
  region: "ap-south-1"
});

const uploadFile = async (files) => {
  return new Promise( function(resolve, reject) {
    let s3 = new AWS.S3({ apiVersion: '2006-03-01' });

    let uploadParams = {
      ACL: 'public-read',
      Bucket: 'classroom-training-bucket',
      Key: 'Aman/Products-Management/' + files.originalname,
      Body: files.buffer
    };

    s3.upload(uploadParams, (err,data) => {
      if(err) {
        return reject({ 'error': err });
      }else{
      // console.log(data)
      return resolve(data.Location);}
    })
  })
}

module.exports.uploadFile = uploadFile;