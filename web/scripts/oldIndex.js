/**
 * Created by Primoz on 26. 07. 2016.
 */
var SESSION_STATE = Object.freeze({NOT_SHARED: 0, HOSTING: 1, SUBSCRIBED: 2});
var sessionState = SESSION_STATE.NOT_SHARED;

function init() {
    registerClickListeners();
    //initNavigators();

    var canvas = document.getElementById("med3d-canvas");

    window.onresize = function(){
        resizeCanvas();
    };

    initializeRenderer(canvas);

    var urlParams = getUrlParameters();

    // Check if the session uuid was given
    if (urlParams.sessionUuid) {
        createSessionSubscriberScene(urlParams.sessionUuid, function (success) {
            if (success) {
                // Successfully subscribed
                $("#dropdownCloseSessionItem").removeClass("collapse");
                $(".warning-active-subscription").css("display", "block");
                sessionState = SESSION_STATE.SUBSCRIBED;
            }
            else {
                // Something went wrong
                $("#dropdownStartSharingSceneItem").removeClass("collapse");
                createDefaultEmptyScene();
            }
            resizeCanvas();
        });
    }
    else {
        $("#dropdownStartSharingSceneItem").removeClass("collapse");
        createDefaultEmptyScene();
        resizeCanvas();
    }
}

function registerClickListeners() {
    // Do not close on sub-dropdown click
    $('.dropdown-submenu-anchor').bind('click', function (e) {
        e.stopPropagation()
    });

    //region Wavefront OBJ opening modal
    var objFileOpenButton = $("#objFileOpenButton");
    var objButtonTooltipWrapper = objFileOpenButton.closest(".tooltip-wrapper");
    var objFileInput = $("#objFileInput");
    var objLoaderModal = $('#objLoaderModal');

    objFileInput.change(function(event) {
        if (objFileInput.val() === "") {
            objFileOpenButton.prop('disabled', true);
            objButtonTooltipWrapper.tooltip('enable');
        }
        else {
            objFileOpenButton.prop('disabled', false);
            objButtonTooltipWrapper.tooltip('disable');
        }
    });

    objFileOpenButton.click(function() {
        if (sessionState === SESSION_STATE.SUBSCRIBED) {
            sessionUnsubscribeEvent();
        }

        var objFile = objFileInput.prop('files')[0];
        loadObjFromFile(objFile);
        objLoaderModal.modal('hide');
    });
    //endregion

    //region Volume MHD opening modal
    var volumeMhdFileInput = $("#volumeMhdFileInput");
    var volumeRawFileInput = $("#volumeRawFileInput");
    var volumeIsoValueInput = $("#volumeIsoValueInput");
    var volumeFileOpenButton = $("#volumeFileOpenButton");
    var volumeButtonTooltipWrapper = volumeFileOpenButton.closest(".tooltip-wrapper");
    var volumeOpenModal = $("#volumeOpenModal");

    var volOpenUnlocker = function() {
        if (volumeMhdFileInput.val() === "" || volumeRawFileInput.val() === "" || volumeIsoValueInput.val() === "") {
            volumeFileOpenButton.prop('disabled', true);
            volumeButtonTooltipWrapper.tooltip('enable');
        }
        else {
            volumeFileOpenButton.prop('disabled', false);
            volumeButtonTooltipWrapper.tooltip('disable');
        }
    };

    volumeMhdFileInput.change(volOpenUnlocker);
    volumeRawFileInput.change(volOpenUnlocker);
    volumeIsoValueInput.change(volOpenUnlocker);

    volumeFileOpenButton.click(function() {
        if (sessionState === SESSION_STATE.SUBSCRIBED) {
            sessionUnsubscribeEvent();
        }

        var mhdFile = volumeMhdFileInput.prop('files')[0];
        var rawFile = volumeRawFileInput.prop('files')[0];
        var isoval = parseFloat(volumeIsoValueInput.val());
        loadMhdVolumeFromFile(mhdFile, rawFile, isoval);

        volumeOpenModal.modal('hide');
    });
    //endregion

    //region Scene collaboration
    var dropdownStartSharingSceneItem = $("#dropdownStartSharingSceneItem");
    var dropdownStopSharingSceneItem = $("#dropdownStopSharingSceneItem");
    var dropdownCloseSessionItem = $("#dropdownCloseSessionItem");

    // Stop collaboration scene event
    dropdownStopSharingSceneItem.bind("click", function() {
        stopSharingScene();

        sessionState = SESSION_STATE.NOT_SHARED;

        // Toggle start collaboration button
        dropdownStopSharingSceneItem.addClass("collapse");
        dropdownStartSharingSceneItem.removeClass("collapse");

        // Toggle URL
        $("#dropdownSessionUrlItem").addClass("collapse");

        $("#applicationStatus").text("Stopped scene collaboration.");
    });

    // Start collaboration scene event
    dropdownStartSharingSceneItem.bind("click", function() {
        // Disable scene collaboration button
        dropdownStartSharingSceneItem.addClass('disabled');
        $("#applicationStatus").text("Uploading the scene to the server.");

        startSharingScene(function (result) {
            // Scene was shared successfully
            if (result.status === 0) {
                sessionState = SESSION_STATE.HOSTING;

                // Toggle stop collaboration button
                dropdownStartSharingSceneItem.removeClass('disabled');
                dropdownStartSharingSceneItem.addClass("collapse");
                dropdownStopSharingSceneItem.removeClass("collapse");

                // Toggle URL
                $("#dropdownSessionUrlItem").removeClass("collapse");
                $("#sessionUrl").val(result.url);
                $("#sharedSessionUrl").modal();

                // Notification
                $("#applicationStatus").text("Sharing scene.");
            }
            else {
                $("#applicationStatus").text("Something went wrong while trying to share the scene. Status: " + result.status + ".");
            }
        });
    });

    // Close the session (Subscriber viewpoint)
    dropdownCloseSessionItem.bind("click", sessionUnsubscribeEvent);
    //endregion
}

function sessionUnsubscribeEvent() {
    sessionUnsubscribe();

    $("#dropdownCloseSessionItem").addClass("collapse");
    $("#dropdownStartSharingSceneItem").removeClass("collapse");
    sessionState = SESSION_STATE.NOT_SHARED;

    $(".warning-active-subscription").css("display", "none");
}

function getUrlParameters() {
    var query;

    var pos = location.href.indexOf("?");
    if(pos==-1) return [];
    query = location.href.substr(pos+1);

    var result = {};
    query.split("&").forEach(function(part) {
        if(!part) return;
        part = part.split("+").join(" "); // replace every + with space, regexp-free version
        var eq = part.indexOf("=");
        var key = eq>-1 ? part.substr(0,eq) : part;
        var val = eq>-1 ? decodeURIComponent(part.substr(eq+1)) : "";
        var from = key.indexOf("[");
        if(from==-1) result[decodeURIComponent(key)] = val;
        else {
            var to = key.indexOf("]");
            var index = decodeURIComponent(key.substring(from+1,to));
            key = decodeURIComponent(key.substring(0,from));
            if(!result[key]) result[key] = [];
            if(!index) result[key].push(val);
            else result[key][index] = val;
        }
    });
    return result;
}