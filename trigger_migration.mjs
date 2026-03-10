const url = 'https://kkc3349.mycafe24.com/add_organizer_column.php';
fetch(url)
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));
