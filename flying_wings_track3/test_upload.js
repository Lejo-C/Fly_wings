const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const form = new FormData();
  form.append('file', fs.createReadStream('dataset/train/noise/noise_00000.png'));
  form.append('ground_truth', 'noise');

  try {
    const res = await axios.post('http://localhost:5000/api/scan/file', form, {
      headers: form.getHeaders(),
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

test();
