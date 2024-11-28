const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            cb(null, "public");
        } catch (e) {
            cb(e, false);
        }
    },
    filename: function (req, file, cb) {
        // console.log('req: ', req.body);
        // console.log('file: ', file);
        const date = new Date();
        let d = date.getDate().toString();
        let m = date.getMonth() + 1;
        let y = date.getFullYear().toString();
        var currentDate = y + m + d;
        cb(null, file.fieldname + '_' + currentDate + '_' + Date.now() + '_' + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
});

const singleUpload = upload.fields([{ name: 'Upload_File' }, { name: 'Upload_Payment_Proof' }, { name: 'proof_photo' }, { name: 'id_prrof' }, { name: 'cancelled_cheque' }]);

module.exports = { singleUpload };