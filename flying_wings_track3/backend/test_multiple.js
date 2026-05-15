const fs = require('fs');
const path = require('path');

async function testMultiple() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  const files = ['noise_00000.png', 'noise_00001.png', 'noise_00002.png', 'drone_00000.png'];
  const dirs = ['noise', 'noise', 'noise', 'drone'];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filepath = path.join(__dirname, '..', 'dataset', 'train', dirs[i], filename);
    const fileContent = fs.readFileSync(filepath);
    const gt = dirs[i];

    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="ground_truth"\r\n\r\n${gt}\r\n--${boundary}--`)
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
      console.log(`File: ${filename}, Prediction: ${data.data?.prediction}, Correct: ${data.data?.correct}`);
    } catch (err) {
      console.error(err);
    }
  }
}

testMultiple();
