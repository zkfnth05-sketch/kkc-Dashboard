const url = 'https://kkc3349.mycafe24.com/check_raw_row.php?id=859';
fetch(url)
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));
