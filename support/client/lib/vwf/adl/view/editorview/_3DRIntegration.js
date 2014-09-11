function StringBuffer() {
    this.buffer = [];
}
StringBuffer.prototype.append = function append(string) {
    this.buffer.push(string);
    return this;
};
StringBuffer.prototype.toString = function toString() {
    return this.buffer.join("");
};
var Base64 = {
    codex: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(input) {
        var output = new StringBuffer();
        var enumerator = new Utf8EncodeEnumerator(input);
        while (enumerator.moveNext()) {
            var chr1 = enumerator.current;
            enumerator.moveNext();
            var chr2 = enumerator.current;
            enumerator.moveNext();
            var chr3 = enumerator.current;
            var enc1 = chr1 >> 2;
            var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            var enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output.append(this.codex.charAt(enc1) + this.codex.charAt(enc2) + this.codex.charAt(enc3) + this.codex.charAt(enc4));
        }
        return output.toString();
    },
    decode: function(input) {
        var output = new StringBuffer();
        var enumerator = new Base64DecodeEnumerator(input);
        while (enumerator.moveNext()) {
            var charCode = enumerator.current;
            if (charCode < 128) output.append(String.fromCharCode(charCode));
            else if ((charCode > 191) && (charCode < 224)) {
                enumerator.moveNext();
                var charCode2 = enumerator.current;
                output.append(String.fromCharCode(((charCode & 31) << 6) | (charCode2 & 63)));
            } else {
                enumerator.moveNext();
                var charCode2 = enumerator.current;
                enumerator.moveNext();
                var charCode3 = enumerator.current;
                output.append(String.fromCharCode(((charCode & 15) << 12) | ((charCode2 & 63) << 6) | (charCode3 & 63)));
            }
        }
        return output.toString();
    }
}

function Utf8EncodeEnumerator(input) {
    this._input = input;
    this._index = -1;
    this._buffer = [];
}
Utf8EncodeEnumerator.prototype = {
    current: Number.NaN,
    moveNext: function() {
        if (this._buffer.length > 0) {
            this.current = this._buffer.shift();
            return true;
        } else if (this._index >= (this._input.length - 1)) {
            this.current = Number.NaN;
            return false;
        } else {
            var charCode = this._input.charCodeAt(++this._index);
            // "\r\n" -> "\n"
            //
            if ((charCode == 13) && (this._input.charCodeAt(this._index + 1) == 10)) {
                charCode = 10;
                this._index += 2;
            }
            if (charCode < 128) {
                this.current = charCode;
            } else if ((charCode > 127) && (charCode < 2048)) {
                this.current = (charCode >> 6) | 192;
                this._buffer.push((charCode & 63) | 128);
            } else {
                this.current = (charCode >> 12) | 224;
                this._buffer.push(((charCode >> 6) & 63) | 128);
                this._buffer.push((charCode & 63) | 128);
            }
            return true;
        }
    }
}

function Base64DecodeEnumerator(input) {
    this._input = input;
    this._index = -1;
    this._buffer = [];
}
Base64DecodeEnumerator.prototype = {
    current: 64,
    moveNext: function() {
        if (this._buffer.length > 0) {
            this.current = this._buffer.shift();
            return true;
        } else if (this._index >= (this._input.length - 1)) {
            this.current = 64;
            return false;
        } else {
            var enc1 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc2 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc3 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc4 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;
            this.current = chr1;
            if (enc3 != 64) this._buffer.push(chr2);
            if (enc4 != 64) this._buffer.push(chr3);
            return true;
        }
    }
};
define(["vwf/view/editorview/Editor"], function(Editor) {
    var __3DRIntegration = {};

    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                Editor = Editor.getSingleton();
                initialize.call(__3DRIntegration);
                isInitialized = true;
            }
            return __3DRIntegration;
        }
    }

    function initialize() {
        $(document.body).append("<div id='ModelUploadDialog'></div>");
        $(document.body).append("<div id='ModelLibrary'></div>");
        $(document.body).append("<div id='ModelDetails'></div>");

        $('#ModelUploadDialog').hide();
        $('#ModelUploadDialog').load('vwf/view/editorview/uploadModel.html', function() {

            __3DRIntegration.hookupUploadDialog();

        });

        $('#ModelLibrary').append("<div id='ModelSearchResults'></div>");
        $('#ModelLibrary').append("<div id='ModelSearchPanel'></div>");
        $('#ModelSearchPanel').append("<input type='text' id='ModelSearchTerm' style='border-radius: 5px;'></input>");
        $('#ModelSearchPanel').css('overflow', 'auto');
        $('#ModelSearchPanel').append("<div id='ModelSearchButton'></div>");
        $('#ModelSearchPanel').append("<div id='ResultsPages' style='display: inline;'></div>");
        $('#ModelSearchButton').button({
            label: 'Search'
        });


        $('#ModelSearchTerm').keydown(function(e) {
            e.stopPropagation();
        });

        this.displayUploadPercent = function(per) {
            per = per - Math.floor(per);
            var f = 2 * Math.PI * per;
            var x = -1;
            var y = 0;
            var x1 = x * Math.cos(f) - y * Math.sin(f);
            var y1 = y * Math.cos(f) + x * Math.sin(f);

            x1 *= 25;
            y1 *= 25;

            x1 += 30;
            y1 += 30;

            if (per >= .5)
                $('#progresspath').attr('d', 'M5 30            A 25 25, 0, 1, 1, ' + x1 + ' ' + y1);
            else
                $('#progresspath').attr('d', 'M5 30            A 25 25, 0, 0, 1, ' + x1 + ' ' + y1);

        }
        this.hookupUploadDialog = function() {

            $('#ModelUploadFile').change(function() {

                var files = $('#ModelUploadFile')[0].files;
                if (!files) return;
                var file = files[0];
                if (!file) return;
                console.log(file);

                var type = file.name.substr(file.name.lastIndexOf('.'));
                if (type != '.zip') {
                    $('#uploadStatus').text('Choose a ZIP file that contains a 3D Model and the associated textures');
                    return;

                }

                $('#filename').text(file.name)
                $('#filesize').text(Math.floor(file.size / 1000) + 'KB');
                $('#filetype').text(type)
                $('#uploadTitle').val(file.name)
                $('#uploadStatus').text('Ready. Click "Upload"');
                $('#submit3DRUpload').removeClass('_3drDisabled');
                $('#progresspath').attr('stroke', '#779');
                __3DRIntegration.displayUploadPercent(0);
            })







            $('#cancel3DRUpload').click(function() {
                $('#ModelUploadDialog').hide();

            });
            $('#submit3DRUpload').click(function() {

                if ($('#submit3DRUpload').hasClass('_3drDisabled')) {
                    return;
                }
                var files = $('#ModelUploadFile')[0].files;
                var file = files[0];
                var xhr = new XMLHttpRequest();
                if (xhr.upload && file.size <= 30 * 1024 * 1024) {
                    xhr.open("POST", "./vwfdatamanager.svc/3drupload?title=" + encodeURIComponent($('#uploadTitle').val()) + "&description=" + encodeURIComponent($('#uploadDescription').val()), true);
                    xhr.setRequestHeader("X_FILENAME", file.name);


                    $('#uploadStatus').text('Uploading')
                    xhr.upload.addEventListener("progress", function(oEvent) {
                        //upload progress
                        var percentComplete = oEvent.loaded / oEvent.total;
                        __3DRIntegration.displayUploadPercent(percentComplete);
                        $('#uploadStatus').text('Uploading ' + percentComplete + '%')
                    }, false);
                    xhr.upload.addEventListener("load", function() {
                        $('#uploadStatus').text("Waiting for conversion.");
                        $('#progresspath').attr('stroke', '#7E9');

                        var percent = 0;

                        var animateWait = function() {
                            percent += .01;
                            __3DRIntegration.displayUploadPercent(percent);
                            if ($('#uploadStatus').text() == "Waiting for conversion.") {
                                window.setTimeout(animateWait, 20);
                            }
                        }
                        window.setTimeout(animateWait, 20);

                    }, false);

                    xhr.upload.addEventListener("error", function() {
                        $('#uploadStatus').text("upload error.");
                        $('#progresspath').attr('stroke', '#E79');

                    }, false);

                    xhr.addEventListener("error", function() {
                        $('#uploadStatus').text("xhr error.");
                        $('#progresspath').attr('stroke', '#E79');

                    }, false);
                    xhr.addEventListener("load", function() {
                        var pid = JSON.parse(xhr.responseText);
                        $('#uploadStatus').text("Fetching Metadata");

                        _ModelLibrary.getMetadata(pid,
                            function(object) {
                                var metadata = object;
                                if (metadata.ConversionAvailable == false) {
                                    $('#uploadStatus').text("Model could not be converted.");
                                    $('#progresspath').attr('stroke', '#E79');
                                    return;
                                }

                                _ModelLibrary.MetadataCache[pid] = object;
                                __3DRIntegration.insertObject(pid);
                                var proto = _ModelLibrary.createProtoForPID(pid);
                                _InventoryManager.addProto(proto, $('#uploadTitle').val(), '3DRObject');
                                $('#uploadStatus').text("Downloading");
                                window.setTimeout(function() {
                                    $('#ModelUploadDialog').hide();
                                }, 500);
                            },
                            function(thrownError) {

                                $('#uploadStatus').text(thrownError);
                            });



                    }, false);



                    var formData = new FormData();
                    formData.append('model', file);

                    xhr.send(formData);
                } else {
                    $('#uploadStatus').text('Error. Choose a different file.');

                }
            });
        }

        $('#ModelLibrary').dialog({
            title: 'Search 3DR',
            autoOpen: false,
            maxHeight: 400,
            maxWidth: 750,
            width: 750,
            height: 'auto',
            minHeight: 20,
            resizable: false,
            position: 'center',
            modal: true,
            movable: true
        });

        $('#ModelDetails').dialog({
            title: 'Model Details',
            autoOpen: false,
            maxHeight: 400,
            maxWidth: 400,
            width: 400,
            height: 'auto',
            resizable: false,
            position: 'center',
            modal: true,
            movable: false,
            buttons: {
                Close: function() {
                    $('#ModelDetails').dialog('close');
                },
                Create: function() {
                    $('#ModelDetails').dialog('close');
                    $('#ModelLibrary').dialog('close');
                    _ModelLibrary.insertObject(_ModelLibrary.DetailsPID);
                }
            }
        });
        $('#ModelLibrary').append("<div style='margin-top: 2em;color: grey;font-size: 0.8em;'>This interface allows you to load 3D models from a library of content. This content will be created at the center of your viewport. Type a search term in the box above. Click on thumbnails to display additional data about the objects. If you wish to upload content, please visit the <a target='new' href='http://3dr.adlnet.gov'>ADL 3D Repository</a>. Here, you can upload assets to be included in this virtual world. Be careful to mark your content as publically accessable, as this system can only load public content at this time.</div>");
        this.currentPage = 0;
        this.pageLength = 42;
        this.Results = [];
        this.MetadataCache = [];
        this.show = function() {
            $('#ModelLibrary').dialog('open');
        }
        this.isOpen = function() {
            return $("#ModelLibrary").dialog("isOpen");
        }
        this.hide = function() {
            $('#ModelLibrary').dialog('close');
        }
        this.showUpload = function() {
            if (!_UserManager.GetCurrentUserName()) {
                alertify.alert('You must be logged in to upload a model');
                return;
            }
            $('#ModelUploadDialog').show();
            $('#filename').text('')
            $('#filesize').text('')
            $('#filetype').text('')
            $('#uploadTitle').val('')
            $('#uploadStatus').text('Choose a ZIP file containing a DAE, FBX, OBJ, 3DS, or SKP file and textures.');
            $('#submit3DRUpload').addClass('_3drDisabled');
            __3DRIntegration.displayUploadPercent(0);
            $('#progresspath').attr('stroke', '#779');

        }
        this.BuildModelRequest = function(pid) {
            return "./vwfdatamanager.svc/3drdownload?pid=" + pid;

        }
        this.canDownload = function(pid) {

            var downloadPermssion = $.ajax({
                async: false,
                dataType: 'json',
                method: "GET",
                url: "./vwfdatamanager.svc/3drpermission?pid=" + pid
            }).responseText.toLowerCase();
            return (downloadPermssion == '"fetchable"' || downloadPermssion == '"editable"' || downloadPermssion == '"admin"')
        }
        this.createProtoForPID = function(pid) {
            var pos = [0, 0, 0];
            var proto = {
                extends: 'asset.vwf',
                source: _ModelLibrary.BuildModelRequest(pid),
                type: 'subDriver/threejs/asset/vnd.osgjs+json+compressed',
                properties: {
                    rotation: [1, 0, 0, 0],
                    tranform: MATH.transposeMat4(MATH.translateMatrix(pos)),
                    scale: [_ModelLibrary.MetadataCache[pid].UnitScale, _ModelLibrary.MetadataCache[pid].UnitScale, _ModelLibrary.MetadataCache[pid].UnitScale],
                    owner: document.PlayerNumber,
                    type: '3DR Object',
                    DisplayName: _ModelLibrary.MetadataCache[pid].Title

                }
            };
            proto.properties.DisplayName = Editor.GetUniqueName(proto.properties.DisplayName);
            return proto;
        }
        this.insertObject = function(pid) {
            var pos = [0, 0, 0];
            if (!_UserManager.GetCurrentUserName()) {
                _Notifier.notify('You must log in to create objects');
                return;
            }
            if (Editor) {
                pos = Editor.GetInsertPoint();
            }
            pos[0] = Editor.SnapTo(pos[0], Editor.MoveSnap);
            pos[1] = Editor.SnapTo(pos[1], Editor.MoveSnap);
            pos[2] = Editor.SnapTo(pos[2], Editor.MoveSnap);


            if (_ModelLibrary.canDownload(pid)) {

                var proto = this.createProtoForPID(pid);
                proto.properties.transform = MATH.transposeMat4(MATH.translateMatrix(pos));;

                var newname = GUID();
                //vwf_view.kernel.createNode(proto , null);
                //vwf_view.kernel.createChild('index-vwf',GUID(),proto,null,null); 
                _UndoManager.recordCreate('index-vwf', newname, proto);
                vwf_view.kernel.createChild('index-vwf', newname, proto, null, null);
                _Editor.SelectOnNextCreate([newname]);
            } else {
                _Notifier.alert('The Sandbox server does not have permission to access this model. Please edit the model permissions, or contact the author to do so.');
            }
        }
        this.BuildResult = function(obj, i) {
            var result = "<div style='list-style-type:none;border-style:solid;border-color:#999999;border-width:1px;vertical-align: top;overflow:hidden;border-radius:5px 5px 5px 5px;margin: 1px 1px 1px 1px;width:100px;height:100px;display:inline-block'>";
            result += "<div style='text-align:center'>";
            result += "<img style='box-shadow:2px 2px 10px gray;width:50px;margin: 5px 5px 0px 5px;' id='Thumb" + i + "' src='./vwfdatamanager.svc/3drthumbnail?pid=" + obj.PID + "' />";
            result += "<p id='Title" + i + "' style='text-decoration:underline;cursor:pointer;text-overflow: ellipsis;overflow: hidden;margin: 3px;'>" + obj.Title + "</p>";
            result += "</div>";
            result += "</div>";
            return result;
        }
        this.DisplayMetadata = function(obj, i) {
            var ret = "";
            ret += "<div style='text-align: center;'><img style='box-shadow:2px 2px 10px gray;width:150px;margin: 5px 5px 0px 5px;' + src='./vwfdatamanager.svc/3drthumbnail?pid=" + obj.PID + "' />";
            ret += "<p style='text-decoration:underline;text-overflow: ellipsis;overflow: hidden;margin: 3px;'>" + obj.Title + "</p></div>";
            ret += "<p> Keywords:" + obj.Keywords + "</p>";
            ret += "<p> Artist:" + obj.ArtistName + "</p>";
            ret += "<p> Description:" + obj.Description + "</p>";
            ret += "<p> Polygons:" + obj.NumPolygons + "</p>";
            ret += "<p> Conversion:" + obj.ConversionAvailable + "</p>";
            ret += "<p> Anonymous Download:" + obj.AnonymousDownloadAvailable + "</p>";
            jQuery('#ModelDetails').html(ret);
            $('#ModelDetails').dialog('option', 'position', 'center');
        }
        this.showDetails = function(pid) {
            this.DetailsPID = pid;
            $('#ModelDetails').dialog('open');
            if (_ModelLibrary.MetadataCache[pid]) {
                _ModelLibrary.DisplayMetadata(_ModelLibrary.MetadataCache[pid]);
            } else {
                _ModelLibrary.getMetadata(pid,
                    function(object) {
                        var metadata = object;
                        jQuery('#ModelDetails').css('text-align', 'left');
                        _ModelLibrary.DisplayMetadata(object);
                        _ModelLibrary.MetadataCache[_ModelLibrary.DetailsPID] = object;
                    },
                    function(thrownError) {
                        alert(thrownError);
                    });

            }
        }
        this.getMetadata = function(pid, success, failure) {
            $.ajax({
                type: "GET",
                //the below is no longer valid - the server proxies all request, and has its own endpoint and auth
                //url: _ModelLibrary.Get3DREndpoint() + "/" + pid + "/Metadata/jsonp?ID=00-00-00&callback=?",
                url: "./vwfdatamanager.svc/3drmetadata?pid=" + pid,
                dataType: "json",
                success: function(object, responseStatus, request) {
                    var metadata = object;
                    success(object);

                }.bind(this),
                error: function(xhr, ajaxOptions, thrownError) {
                    failure(thrownError);
                }
            });
        }
        this.showResults = function(page) {
            jQuery('#ModelSearchResults').html("");
            for (var i = 0; i < this.Results.length / this.pageLength; i++) {
                if (i == page) {
                    jQuery('#resultspage' + i).css('color', 'black');
                    jQuery('#resultspage' + i).css('text-decoration', 'none');
                } else {
                    jQuery('#resultspage' + i).css('color', 'blue');
                    jQuery('#resultspage' + i).css('text-decoration', 'underline');
                }
            }
            this.currentPage = page;
            this.pageLength = 42;
            for (var i = this.currentPage * this.pageLength; i < Math.min(this.currentPage * this.pageLength + this.pageLength, _ModelLibrary.Results.length); i++) {
                jQuery('#ModelSearchResults').append(_ModelLibrary.BuildResult(_ModelLibrary.Results[i], i));
                //jQuery("#Thumb"+i).click(insertObject.bind(_ModelLibrary.Results[i]));
                var j = i;
                jQuery("#Title" + i).attr('pid', _ModelLibrary.Results[i].PID);
                jQuery("#Title" + i).click(function() {
                    var pid = $(this).attr('pid');
                    _ModelLibrary.showDetails(pid);
                });
                jQuery("#Metadata" + i).hide();
            }
        }
        this.SetResults = function(o) {
            jQuery('#ResultsPages').html("");
            this.Results = o;
            this.showResults(0);
            for (var i = 0; i < this.Results.length / this.pageLength; i++) {
                jQuery('#ResultsPages').append("<div id='resultspage" + i + "' style='display: inline;cursor: pointer;padding: 5px;color: blue;text-decoration: underline;'>" + i + "</div>");
                jQuery('#resultspage' + i).attr('pagenum', i);
                jQuery('#resultspage' + i).click(function() {
                    _ModelLibrary.showResults($(this).attr('pagenum'));
                });
            }
        }
        this.Search3DR = function(e) {
            var searchterms = jQuery('#ModelSearchTerm').val();

            $.ajax({
                type: "GET",
                //the below is no longer valid - the server proxies all request, and has its own endpoint and auth
                //url: _ModelLibrary.Get3DREndpoint() + "/Search/" + searchterms + "/jsonp?ID=00-00-00&callback=?",
                url: "./vwfdatamanager.svc/3drsearch?search=" + searchterms,
                dataType: "json",
                async: true,
                success: function(object, responseStatus, request) {
                    jQuery('#ModelSearchResults').html("");
                    jQuery('#ResultsPages').html("");
                    _Notifier.stopWait();
                    _ModelLibrary.SetResults(object);
                    $('#ModelLibrary').dialog('option', 'position', 'center');
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    alertify.alert(thrownError);
                    _Notifier.stopWait();
                }
            });
            _Notifier.startWait('Searching...');
        }
        $('#ModelSearchButton').click(function() {
            _ModelLibrary.Search3DR()
        });
    }
});