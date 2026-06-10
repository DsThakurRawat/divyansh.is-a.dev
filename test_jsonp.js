// We'll test if codeforces API returns correct JSONP response
const https = require('https');

https.get('https://codeforces.com/api/user.rating?handle=lost_boy21&jsonp=myCallback', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(data.substring(0, 100)); // Print first 100 chars to verify
    });
}).on('error', (e) => {
    console.error(e);
});
