const mysql = require('mysql');
const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('qs');

// b1: Ket noi den database
const conn = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456@Abc',
    database: 'QLVATTU'
})

// Thuc hien cac cau  lenh truy van
// thu hien insert bang Vattu
function addProduct(code, name) {
    return new Promise((resolve, reject) => {
        let sql = `INSERT INTO VatTu(MaVT, TenVT) VALUES (${code}, '${name}')`
        conn.query(sql, (err, result, fields) => {
            if (err) {
                reject(err.message)
            }
            resolve('Thêm mới thành công')
        })
    })
}

function getProductInDB(){
    return new Promise(((resolve, reject) => {
        let sql = `SELECT * FROM VatTu`
        conn.query(sql, (err, result, fields) => {
            if (err) {
                reject(err.message)
            }
            resolve(result)
        })
    }))
}

function getFormCreate(req, res) {
    fs.readFile('./views/create.html', 'utf8', ((err, data) => {
        if (err) {
            throw new Error(err.message)
        }
        res.writeHead(200, {ContentType: 'text/html'})
        res.write(data)
        res.end();
    }))
}
function getFormUpdate(req, res, id){
    // lay thong tin sp theo id o trong csdl
    let sql = `SELECT * FROM VatTu WHERE MaVT = ${id}`;

    conn.query(sql, (err, result) => {
        if (err) {
            throw new Error(err.message)
        }
        console.log(result)

        fs.readFile('./views/update.html', 'utf8', ((err, data) => {
            if (err) {
                throw new Error(err.message)
            }

            let html = '';
            html = `<form action="/update?id=${result[0].MaVT}" method="post">
                    MaVT: <input type="text" name="code" value="${result[0].MaVT}" disabled>
                    TenVt: <input type="text" name="name" value="${result[0].TenVT}">
                    <button type="submit">Tao moi</button>
                    </form>`

            data = data.replace('{form-update}', html)
            res.writeHead(200, {ContentType: 'text/html'})
            res.write(data)
            res.end();
        }))
    })



}

function insertProduct(req, res){
    // b1 lay du lieu tu form
    let data = ''
    req.on('data', chunk => {
        data += chunk;
    })

    req.on('end', () => {
        let dataPare = qs.parse(data);
        addProduct(dataPare.code, dataPare.name)
            .then(result => {
                console.log(result);
                // quay tro lai trang danh sach
                res.writeHead(301, {Location: 'http://localhost:8080/'})
                res.end();
            })
            .catch(err => {
                console.log(err)
                res.end(err);
        })
    })
}

function showListProduct(req, res) {
    getProductInDB().then(result => {
        fs.readFile('./views/index.html', 'utf8', (err, data) => {
            if (err) throw new Error(err.message);

            let html = ''
            result.forEach((item) => {
                html += '<tr>';
                html += '<td>' + item.MaVT + '</td>';
                html += '<td>' + item.TenVT + '</td>';
                html += '<td>';
                html += `<a href="/delete?id=${item.MaVT}">Delete</a>`
                html += `<a href="/update?id=${item.MaVT}">Update</a>`
                html += '</td>';
                html += '</tr>'
            })

            res.writeHead(200, {ContentType: 'text/html'})
            data = data.replace('{list-items}', html);
            res.write(data)
            res.end();
        })
    })
}

function deleteProduct(id, req, res) {
    let sql = `DELETE FROM VatTu WHERE MaVT = ${id}`;

    conn.query(sql, (err) => {
        if (err) {
            throw new Error(err.message);
        }

        res.writeHead(301, {Location: 'http://localhost:8080/'})
        res.end();
    })
}

function updateProductDatabase(id, req, res) {
    let data = ''
    req.on('data', chunk => {
        data += chunk;
    })

    req.on('end', () => {
        let dataPare = qs.parse(data);
        let sql = `UPDATE VatTu SET TenVT = '${dataPare.name}' WHERE MaVT = ${id}`;
        conn.query(sql, err=> {
            if (err) {
                throw new Error(err.message);
            }

            res.writeHead(301, {Location: 'http://localhost:8080/'})
            res.end();
        })
    })
}

const server = http.createServer(((req, res) => {

    let urlPath = url.parse(req.url).pathname;
    let methodRequest = req.method;

    switch (urlPath) {
        case '/':
            showListProduct(req, res)
            break;
        case '/create':
            if (methodRequest === 'GET') {
                getFormCreate(req, res);
            } else {
                insertProduct(req, res)
            }

           break;
        case '/delete':
            let idProduct = url.parse(req.url, true).query.id;
            console.log(idProduct);
            deleteProduct(idProduct, req, res)
            break;
        case '/update':
            let idProductUpdate = url.parse(req.url, true).query.id;
            if (methodRequest === 'GET') {
                getFormUpdate(req, res, idProductUpdate)
            } else  {
                updateProductDatabase(idProductUpdate, req, res)
            }

    }

}))

server.listen(8080, 'localhost', () => {
    console.log('host running on port 8080 in http://localhost:8080')
})
