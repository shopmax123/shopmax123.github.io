var sheetName = 'Sheet1'
var scriptProp = PropertiesService.getScriptProperties()

function intialSetup () {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

function doPost (e) {
  var lock = LockService.getScriptLock()
  lock.tryLock(10000)

  try {
    var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'))
    var sheet = doc.getSheetByName(sheetName)

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    var nextRow = sheet.getLastRow() + 1

    var newRow = headers.map(function(header) {
      return header === 'timestamp' ? new Date() : e.parameter[header]
    })

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])

    sendMail({"range":{"rowStart": nextRow}});
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  finally {
    lock.releaseLock()
  }
}

function sendMail(e){
  
  // Tham chiếu tới sheet Leads
  const sheet = SpreadsheetApp.getActive().getSheetByName("Leads")
  
  // Tham chiếu tới Sheet1
  const sh = SpreadsheetApp.getActive().getSheetByName("Sheet1")
  
  // Tham chiếu tới danh mục sản phẩm - sheet "Product"
  const productSh = SpreadsheetApp.getActive().getSheetByName("Product")
  
  // Tham chiếu tới dữ liệu sản phẩm
  const productDB = productSh.getDataRange().getValues();
  
  // Lấy thông tin khách hàng từ Sheet1
  const customerName  = sh.getRange(e.range.rowStart, 2).getValue(); 
  const customerPhone = sh.getRange(e.range.rowStart, 3).getValue();
  const customerEmail = sh.getRange(e.range.rowStart, 4).getValue();
  const customerAddress = sh.getRange(e.range.rowStart, 5).getValue();
  
  // Lấy thông tin product ID từ Sheet1
  const productId = sh.getRange(e.range.rowStart, 6).getValue();
  
  let html = '';
  
  // Lọc thông tin sản phẩm từ dữ liệu sản phẩm
  const singleProduct = productDB.filter(c => c[0] === productId);
  const productName = singleProduct[0][1];
  const productPrice = singleProduct[0][2];
  
  // Ghi thông tin về tên sản phẩm, giá sản phẩm vào cột số 8, cột số 9 trong sheets "Leads"
  sheet.getRange(e.range.rowStart, 8).setValue(productName);
  sheet.getRange(e.range.rowStart, 9).setValue(productPrice);
  
  console.log(JSON.stringify(singleProduct));
  
  // Template email gửi tới khách hàng
  html = `
  <p>Dear ${customerName},</p>
  <p>Shopmax xin phép xác nhận thông tin đặt hàng của quý khách:</p>
  <p>Sản phẩm: ${productName}</p>
  <p>Bạn vui lòng làm theo các bước hướng dẫn dưới đây để hoàn thiện đơn đặt hàng nhé:</p>
  <p>Giá trị đơn hàng: ${formatCurrency(productPrice, "VND")}</p>
  <p>Nội dung chuyển khoản:  ${customerName}  ${customerPhone}</p>
  <br />
    <p>Thông tin các tài khoản ngân hàng:</p>
    <p>1. Vietcombank</p>
    <p>Chủ tài khoản: Chủ tài khoản</p>
    <p>STK: 09999999999</p>
    <p>Chi nhánh XYZ, Hà Nội</p>
    <br/>
    <p>Sau khi chuyển khoản thành công, bạn vui lòng gửi lại hình ảnh biên lai chuyển khoản qua email <email> để đơn hàng nhanh chóng được xử lý.</p>
    <br/>
    <p>Trân trọng,</p>
    <p>--</p>
    <p>Thanks & Regards,</p>
    <br/>`;
  
  MailApp.sendEmail({
    to: customerEmail,
    subject: "Shopmax thân gửi - Hướng dẫn hoàn thành đơn hàng",
    htmlBody: html,
    name: "Shopmax"
  });
  
  sheet.getRange(e.range.rowStart,10).setValue("EMAIL_SENT");
  sheet.getRange(e.range.rowStart,11).setValue(new Date());
}

function formatCurrency(n, currency) {
	return new Intl.NumberFormat('vi', {
  	style: 'currency',
  	currency: currency
  }).format(n);
}