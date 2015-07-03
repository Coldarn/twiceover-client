define(function () {
    return {
        show: function () {
            requirejs(['text!partials/ImportDialog.html'], function (html) {
                var el = document.getElementById('import-dialog'),
                    dialogEl = document.querySelector('.dialog');
                
                if (!el) {
                    var dialogEl = document.querySelector('.dialog');
                    dialogEl.innerHTML = html;
                    el = dialogEl.firstChild;
                    
                    el.querySelector('button.close').addEventListener('click', function () {
                        dialogEl.style.visibility = 'hidden';
                    });
                } else {
                    dialogEl.style.visibility = undefined;
                }
            });
        },
        hide: function () {
            var el = document.getElementById('import-dialog');
            if (el) {
                el.style.visibility = 'hidden';
            }
        }
    };
});