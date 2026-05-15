const fs = require('fs');

async function test() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileContent = fs.readFileSync('../dataset/train/noise/noise_00000.png');

  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="noise_00000.png"\r\nContent-Type: image/png\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="ground_truth"\r\n\r\nnoise\r\n--${boundary}--`)
  ]);

  try {
    const response = await fetch('http://localhost:5000/api/scan/file', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: payload
    });
    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();
