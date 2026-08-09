/** @param {string} name */
function slug(name) {
	name = name.toLowerCase();
	return name.replace(/[^a-z]/g, '');
}

let names = `Sarah Kamilia Nadin,mat
Kenzie Dilvito,mat
Rafa Abqari Bedros,mat
Prasetyo Ziyad Fahrein,geo
Yasmin Adya Putri Delvira,geo
Dean Alvano Zaghlul,ast
Falah Athaya Moztra,ast
Asiah Aththohiroh,ast
Livia Carissa Azzahra,eko
Mazaya Addini Nashiha,eko
Daivo Zuhroh Pranato,keb
Naqila Deria Pamepta,keb
Nameera Dwina Putri,keb
Safira Nailah Kayyisah,kim
Kiara Sarah Zahiyah,kim
Dhafia Tri Putri Balques,kim
Maulaya Yusuf Wijaya,inf
Rafa Al-Rasyid Yusuf,inf
Hafy Al Athfan,fis
Muhammad Beyhaqi Habibie Setiawan,fis
Ahmad Binarwan Arfa Rangkuti,fis
Rhazes Ibrah Adh Daffa,bio
Ratih Wagistari,bio`

names = names.split('\n');

for (let i = 0; i < names.length; i++) {
	names[i] = names[i].split(',');
}

console.log(names);