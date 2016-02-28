'use strict';

function getCSRFCookie() {
  var index = document.cookie.indexOf('X-CSRF-Token') + 13;
  if (index < 0) {
    return '';
  }

  return document.cookie.substr(index, 36);
}

function apisHandleAddAnswer(xhr) {
  var self = xhr;

  return function() {
    if (self.readyState === 4 && self.status === 200) {
      var response = this.responseText;
      var answer = document.getElementById('apis_addAnswer');
      answer.innerHTML = JSON.parse(response).total;
    }
  };
}

function apisAddNumbers() {
  var numberA = document.getElementById('apis_addNumberA').value;
  var numberB = document.getElementById('apis_addNumberB').value;

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = apisHandleAddAnswer(xhr);

  xhr.open('POST', '/apis/add', true);
  xhr.setRequestHeader('X-CSRF-Token', getCSRFCookie());
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send('{"a":' + numberA + ',"b":' + numberB + '}');
}

function apisAttachEvents() {
  var addSubmit = document.getElementById('apis_addSubmit');

  addSubmit.addEventListener('click', apisAddNumbers);
}
