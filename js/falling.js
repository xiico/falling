"use strict";
(function (window) {
    window.fg =
        {
            $: function (selector) {
                return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
            },
            $new: function (name) { return document.createElement(name); },
            loadScript: function (root, name, callBack, callBackParams) {
                var path = root + name.replace(/\./g, '/') + '.js';
                var script = fg.$new('script');
                script.type = 'text/javascript';
                script.src = path;
                script.onload = function (event) {
                    callBack(callBackParams);
                };
                script.onerror = function () { throw ('Failed to load ' + name + ' at ' + path); };
                fg.$('head')[0].appendChild(script);
            }
        }
    //Polyfills
    if (typeof Object.assign != 'function') {
        (function () {
            Object.assign = function (target) {
                'use strict';
                // We must check against these specific cases.
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }

                var output = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source !== undefined && source !== null) {
                        for (var nextKey in source) {
                            if (source.hasOwnProperty(nextKey)) {
                                output[nextKey] = source[nextKey];
                            }
                        }
                    }
                }
                return output;
            };
        })();
    }
    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, "find", {
            value: function (predicate) {
                'use strict';
                if (this == null) {
                    throw new TypeError('Array.prototype.find called on null or undefined');
                }
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }
                var list = Object(this);
                var length = list.length >>> 0;
                var thisArg = arguments[1];
                var value;

                for (var i = 0; i < length; i++) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        return value;
                    }
                }
                return undefined;
            }
        });
    }
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license
    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
    } ());
}
)(window);

fg.System =
    {
        context: null,
        defaultSide: 24,//24
        searchDepth: 16,//16
        canvas: null,
        platform: {},
        init: function () {
            this.canvas = fg.$("#main");
            this.context = this.canvas.getContext("2d");
            this.platform.iPhone = /iPhone/i.test(navigator.userAgent);
            this.platform.iPad = /iPad/i.test(navigator.userAgent);
            this.platform.android = /android/i.test(navigator.userAgent);
            this.platform.iOS = this.platform.iPhone || this.platform.iPad;
            this.platform.mobile = this.platform.iOS || this.platform.android;
            if (this.platform.mobile)
                this.renderMobileInput();
        },
        renderMobileInput: function () {
            var auxCanvas = document.createElement('canvas');
            auxCanvas.width = 64;
            auxCanvas.height = 64;
            var auxCanvasCtx = auxCanvas.getContext('2d');

            var imgLeft = document.getElementById("btnMoveLeft");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.moveTo(48, 16);
            auxCanvasCtx.lineTo(48, 48);
            auxCanvasCtx.lineTo(16, 32);
            auxCanvasCtx.fill();
            imgLeft.src = auxCanvas.toDataURL("image/png");

            var imgRight = document.getElementById("btnMoveRight");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.moveTo(16, 16);
            auxCanvasCtx.lineTo(16, 48);
            auxCanvasCtx.lineTo(48, 32);
            auxCanvasCtx.fill();
            imgRight.src = auxCanvas.toDataURL("image/png");

            var imgJump = document.getElementById("btnJump");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.arc(auxCanvas.width / 2, auxCanvas.height / 2, 16, 0, 2 * Math.PI);
            auxCanvasCtx.fill();
            imgJump.src = auxCanvas.toDataURL("image/png");
        }
    }


fg.Camera = {
    following: null,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    dampX: 0,
    dampY: 0,
    dampRatio: 0.96,
    position: 0,
    init: function () { },
    follow: function (obj) {
        this.following = obj;
    },
    moveTo: function (position) { },
    update: function () {
        if (!this.following) return;

        this.dampX = ((this.following.x - fg.Game.screenOffsetX) - ((fg.System.canvas.width / 2) - (this.following.width / 2))) - (Math.abs(this.following.speedX) >= this.following.maxSpeedX * 0.9 ? this.following.speedX * fg.Timer.deltaTime * 2 : 0);
        this.dampY = ((this.following.y - fg.Game.screenOffsetY) - ((fg.System.canvas.height / 2) - (this.following.height / 2)));

        if (Math.abs(this.dampX) > 0.1) this.dampX *= this.dampRatio;
        if (Math.abs(this.dampY) > 0.1) this.dampY *= this.dampRatio;

        var posX = Math.min(Math.max(((this.following.x) + (this.following.width / 2) - (fg.System.canvas.width / 2)) - this.dampX, 0), fg.Game.currentLevel.width - fg.System.canvas.width);
        var posY = Math.min(Math.max(((this.following.y - this.dampY) + (this.following.height / 2) - (fg.System.canvas.height / 2)), 0), fg.Game.currentLevel.height - fg.System.canvas.height);
        fg.Game.screenOffsetX = Math.round(posX);// this.following.speedX >= 0 ? Math.floor(posX) : Math.ceil(posX);
        fg.Game.screenOffsetY = Math.round(posY);//this.following.speedY <= 0 ? Math.ceil(posY) : Math.round(posY) ;

        this.left = fg.Game.screenOffsetX;
        this.top = fg.Game.screenOffsetY;
        this.right = fg.Game.screenOffsetX + fg.System.canvas.width;
        this.bottom = fg.Game.screenOffsetY + fg.System.canvas.height;
    }
}

fg.protoLevel = {
    name: "",
    entities: [],
    loaded: false,
    height: 0,
    width: 0,
    levelSwiches: [],
    movingPlatforms: [],
    customProperties: [],
    marioBuffer: [],
    loadSettings: function () {
        if (window[this.name].levelSwiches)
            this.levelSwiches = window[this.name].levelSwiches;
        if (window[this.name].movingPlatforms)
            this.movingPlatforms = window[this.name].movingPlatforms;
        if (window[this.name].customProperties)
            this.customProperties = window[this.name].customProperties;
    },
    createEntities: function () {
        var rows = window[this.name].tiles.split('\n');
        for (var i = 0, row; row = rows[i]; i++) {
            if (!this.entities[i]) this.entities[i] = [];
            for (var k = 0, col; col = row[k]; k++) {
                if (!col.match(/[ #\d]/g)) {
                    var cx = 0, cy = 0, idx = 0;
                    if ((!row[k + 1] || !row[k + 1].match(/[\d]/g)) && (!rows[i + 1] || !rows[i + 1][k].match(/[\d]/g))) {
                        this.addEntity(row, col, i, k, cx, cy, idx);
                    }
                    else {
                        if ((row[k + 1] && !!row[k + 1].match(/[\d]/g)) && (!rows[i + 1] || !rows[i + 1][k].match(/[\d]/g))) //multiply rows                            
                            this.addEntityColumn(row, col, i, k, cx, cy, idx);
                        else if ((rows[i + 1] && !!rows[i + 1][k].match(/[\d]/g)) && (!row[k + 1] || !row[k + 1].match(/[\d]/g))) //multiply columns                            
                            this.addEntityRow(rows, row, col, i, k, cx, cy, idx);
                        else
                            this.addEntityArea(rows, row, col, i, k, cx, cy, idx);
                    }
                }
            }
        }
        this.loadLevelCompleted()
    },
    applySettingsToEntity: function (entity) {
        var settings = undefined;
        switch (entity.type) {
            case TYPE.PLATFORM:
                settings = (this.movingPlatforms.find(function (e) { return e.id == entity.id }) || {}).settings;
                break;
            case TYPE.SWITCH:
                settings = (this.levelSwiches.find(function (e) { return e.id == entity.id }) || {}).settings;
                break;
            default:
                settings = (this.customProperties.find(function (e) { return e.id == entity.id }) || {}).settings;
                break;
        }
        if (settings) Object.assign(entity, settings);
        return entity;
    },
    applyFeaturesToEntity: function (entity) {
        var features = undefined;
        switch (entity.type) {
            case TYPE.PLATFORM:
                features = (this.movingPlatforms.find(function (e) { return e.id == entity.id }) || {}).features;
                break;
            case TYPE.SWITCH:
                features = (this.levelSwiches.find(function (e) { return e.id == entity.id }) || {}).features;
                break;
            default:
                break;
        }
        if (features) Object.assign(entity, features);
    },
    load: function () {
        fg.loadScript('levels/', this.name,
            function (self) { self.loadSettings(); self.createEntities(); }, this);
    },
    loadLevelCompleted: function () {
        window[this.name] = null;
        this.loaded = true;
        this.height = this.entities.length * fg.System.defaultSide;
        this.width = this.entities[0].length * fg.System.defaultSide;
        while (this.marioBuffer.length > 0) {
            this.marioBuffer[this.marioBuffer.length - 1].setSubTiles();
            if (this.marioBuffer[this.marioBuffer.length - 1].tileSet == "00010203" || this.marioBuffer[this.marioBuffer.length - 1].tileSet == "30313233") {
                if (this.marioBuffer[this.marioBuffer.length - 1].tileSet == "00010203") {
                    fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet] = 0;
                    this.marioBuffer[this.marioBuffer.length - 1].cacheX = fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet];
                } else {
                    fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet] = fg.System.defaultSide * 3;
                    this.marioBuffer[this.marioBuffer.length - 1].cacheX = fg.System.defaultSide * 3;
                }
            } else {
                if (!fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet]) fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet] = (5 + Object.keys(fg.Render.marioCache).length) * fg.System.defaultSide;
                this.marioBuffer[this.marioBuffer.length - 1].cacheX = fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet];
            }
            this.marioBuffer.pop();
        }
    },
    init: function (name) {
        this.name = name;
        this.load();
    },
    addEntity: function (row, col, i, k, cx, cy, idx) {
        this.entities[i][k] = fg.Entity(i + "-" + k, col, fg.System.defaultSide * k, fg.System.defaultSide * i, 0, 0, 0);
        if (this.entities[i][k].setYs) this.entities[i][k].setYs(null, null);
        if (this.entities[i][k].type == TYPE.MARIO) this.marioBuffer.push(this.entities[i][k]);
    },
    addEntityColumn: function (row, col, i, k, cx, cy, idx) {//row-column
        for (var index = 0; index <= row[k + 1]; index++) {
            cx = fg.System.defaultSide;
            if ("╝╚╗╔".indexOf(col) < 0) {
                if (index == 0) idx = 1;
                else if (index == row[k + 1]) cx *= (idx = 3);
                else cx *= (idx = 2);
            } else
                cx = ((parseInt(row[k + 1]) * (parseInt(row[k + 1]) + 1)) / 2 * fg.System.defaultSide) + (index * fg.System.defaultSide);
            this.entities[i][k + index] = fg.Entity(i + "-" + (k + index), col, fg.System.defaultSide * (k + index), fg.System.defaultSide * i, cx, cy, index);
            if (this.entities[i][k + index].setYs)
                this.entities[i][k + index].setYs(row[k + 1], null);

            if (index > 0)
                this.entities[i][k].segments.push({ l: i, c: k + index });
        }
    },
    addEntityRow: function (rows, row, col, i, k, cx, cy, idx) {
        for (var index = 0; index <= rows[i + 1][k]; index++) {
            if (!this.entities[i + index])
                this.entities[i + index] = [];
            cy = fg.System.defaultSide;
            if ("╝╚╗╔".indexOf(col) < 0) {
                if (index == 0) idx = 4;
                else if (index == rows[i + 1][k]) cy *= (idx = (12 / 4));
                else cy *= (idx = (8 / 4));
            } else
                cy = ((parseInt(rows[i + 1][k]) * (parseInt(rows[i + 1][k]) + 1)) / 2 * fg.System.defaultSide) + (index * fg.System.defaultSide);
            this.entities[i + index][k] = fg.Entity((i + index) + "-" + k, col, fg.System.defaultSide * k, fg.System.defaultSide * (i + index), cx, cy, index);
            if (this.entities[i + index][k].setYs)
                this.entities[i + index][k].setYs(null, rows[i + 1][k]);
        }
    },
    addEntityArea: function (rows, row, col, i, k, cx, cy, idx) {
        var computedPos = null;
        for (var kIndex = 0; kIndex <= row[k + 1]; kIndex++) {
            for (var iIndex = 0; iIndex <= rows[i + 1][k]; iIndex++) {
                if (!this.entities[i + iIndex]) this.entities[i + iIndex] = [];
                if (iIndex == 0) {
                    if (kIndex == 0) computedPos = this.computeEntityAreaPos(5, 1, 1);
                    else if (kIndex == row[k + 1]) computedPos = this.computeEntityAreaPos(7, 3, 1);
                    else computedPos = this.computeEntityAreaPos(6, 2, 1);
                } else if (iIndex == rows[i + 1][k]) {
                    if (kIndex == 0) computedPos = this.computeEntityAreaPos(13, 1, 3);
                    else if (kIndex == row[k + 1]) computedPos = this.computeEntityAreaPos(15, 3, 3);
                    else computedPos = this.computeEntityAreaPos(14, 2, 3);
                } else {
                    if (kIndex == 0) computedPos = this.computeEntityAreaPos(9, 1, 2);
                    else if (kIndex == row[k + 1]) computedPos = this.computeEntityAreaPos(11, 3, 2);
                    else computedPos = this.computeEntityAreaPos(10, 2, 2);
                }
                this.entities[i + iIndex][k + kIndex] = fg.Entity((i + iIndex) + "-" + (k + kIndex), col, fg.System.defaultSide * (k + kIndex), fg.System.defaultSide * (i + iIndex), computedPos.cx, computedPos.cy, (iIndex * (parseInt(row[k + 1]) + 1)) + kIndex);
            }
        }
    },
    computeEntityAreaPos: function (idx, xMultiplyer, yMultiplyer) {
        var cx = fg.System.defaultSide * xMultiplyer;
        var cy = fg.System.defaultSide * yMultiplyer;
        return { idx: idx, cx: cx, cy: cy };
    }
}

fg.protoEntity = {
    index: 0,
    width: fg.System.defaultSide,
    height: fg.System.defaultSide,
    cacheWidth: fg.System.defaultSide,
    cacheHeight: fg.System.defaultSide,
    init: function (id, type, x, y, cx, cy, index) {
        this.type = type;
        this.id = id;
        this.color = "black";
        this.x = x;
        this.y = y;
        this.cacheX = cx;
        this.cacheY = cy;
        this.index = index;
        this.collidable = this.type != TYPE.TUNNEL && this.type != TYPE.DARKNESS && this.type != TYPE.SAVE;
        this.segments = [];
        this.backGround = true;
        return this;
    },
    draw: function (foreGround) {
        if (!fg.Render.cached[this.type]) {
            var c = fg.Render.preRenderCanvas();
            var ctx = c.getContext("2d");
            c = this.drawTile(c, ctx);
            if (c)
                fg.Render.draw(fg.Render.cache(this.type, c), this.cacheX, this.cacheY, this.cacheWidth, this.cacheHeight, this.x, this.y);
        }
        else {
            if (!foreGround && !this.backGround || foreGround && !this.foreGround || this.vanished) return;
            fg.Render.draw(fg.Render.cached[this.type], this.cacheX, this.cacheY, this.cacheWidth, this.cacheHeight, this.x, this.y);
        }
    },
    drawTile: function (c, ctx) {
        c.width = this.width;
        c.height = this.height;
        ctx.fillStyle = 'rgba(0,0,0,.75)';
        ctx.fillRect(0, 0, this.height, this.width);
        return c;
    },
    update: function () { }
}

fg.Active =
    {
        active: true,
        speedX: 0,//-0.49
        speedY: 0,
        grounded: false,
        maxSpeedX: .14,//0.12
        maxSpeedY: .25,
        entitiesToTest: [],
        searchDepth: 6,
        bounceness: 0.2,//0.75
        airFriction: 0.99,
        soilFriction: 0.75,
        ignoreFriction: false,
        accelX: 0.01,
        accelY: 0.1,
        accelAirX: 0.0075,
        entitiesToResolveX: null,
        entitiesToResolveY: null,
        nextPosition: {},
        addedSpeedX: 0,
        backGround: true,
        life: 100,
        update: function () {
            this.addGravity();
            this.entitiesToTest = fg.Game.searchArea(this.x + (this.width / 2), this.y + (this.height / 2), this.searchDepth, this.searchDepth);
            this.lastPosition = { x: this.x, y: this.y, grounded: this.grounded, speedX: this.speedX, speedY: this.speedY };
            this.speedX = this.getSpeedX();
            for (var index = 0, entity; entity = fg.Game.actors[index]; index++)
                this.entitiesToTest.push(entity);
            this.ignoreFriction = false;
            this.checkCollisions();
            this.cacheX = this.grounded ? 0 : this.width;
        },
        getSpeedX: function () {
            return Math.abs(this.speedX) * this.getFriction() > 0.001 ? this.speedX * this.getFriction() : 0;
        },
        getFriction: function () {
            return this.ignoreFriction ? 1 : (this.grounded ? this.soilFriction : this.airFriction);
        },
        getAccelX: function () {
            return this.grounded ? this.accelX : this.accelAirX;
        },
        addGravity: function () {
            this.speedY = this.speedY < this.maxSpeedY ? this.speedY + fg.Game.gravity : this.maxSpeedY;
        },
        checkCollisions: function () {
            this.entitiesToResolveX = [];
            this.entitiesToResolveY = [];
            this.grounded = false;
            this.nextPosition = { x: this.x + ((this.speedX + this.addedSpeedX) * fg.Timer.deltaTime), y: this.y + this.speedY * fg.Timer.deltaTime, width: this.width, height: this.height, id: this.id };
            for (var i = this.entitiesToTest.length - 1, obj; obj = this.entitiesToTest[i]; i--) {
                if (fg.Game.testOverlap(this.nextPosition, obj)) {
                    this.entitiesToResolveX.push(obj);
                    this.entitiesToResolveY.push(obj);
                    if (this.entitiesToResolveX.length >= 4)
                        break;
                }
            }
            if (this.entitiesToResolveX.length > 0) {
                this.resolveCollisions(this.entitiesToResolveX, this.entitiesToResolveY);
            } else {
                this.addedSpeedX = 0;
                this.x = this.nextPosition.x;
                this.y = this.nextPosition.y;
                if (this.canJump && this.y - this.lastPosition.y > 1)
                    this.canJump = false;
            }
        },
        resolveCollisions: function (entitiesToResolveX, entitiesToResolveY) {
            if (entitiesToResolveX.length > 1) entitiesToResolveX.sort(function (a, b) { return a.slope; });
            if (entitiesToResolveY.length > 1) entitiesToResolveY.sort(function (a, b) { return a.slope; });
            var countx = 0, county = 0;
            this.x += (this.speedX + this.addedSpeedX) * fg.Timer.deltaTime;
            while (entitiesToResolveX.length > 0) {
                var obj = entitiesToResolveX[entitiesToResolveX.length - 1];
                this.resolveForX(entitiesToResolveX, obj);
                county++;
                if (county > 4) break;
            }
            this.y += this.speedY * fg.Timer.deltaTime;
            while (entitiesToResolveY.length > 0) {
                var obj = entitiesToResolveY[entitiesToResolveY.length - 1];
                this.resolveForY(entitiesToResolveY, obj);
                countx++;
                if (countx > 4) break;
            }
        },
        resolveForX: function (entitiesToResolve, obj) {
            if (!fg.Game.testOverlap(this, obj) || obj.oneWay) {
                entitiesToResolve.pop();
                return;
            } else {
                if (!obj.slope)
                    this.nonSlopeXcollision(obj);
            }
        },
        nonSlopeXcollision: function (obj) {
            var intersection = this.getIntersection(obj);
            if ((intersection.height >= intersection.width && intersection.height > 1)) {
                if (this.x < obj.x)
                    this.x = obj.x - this.width;
                else
                    this.x = obj.x + obj.width;
                if (this.type != TYPE.ACTOR || !obj.active) {
                    this.speedX = this.speedX * -1;
                    if (obj.active)
                        obj.speedX -= this.speedX * Math.max(this.bounceness, (obj.bounceness || 0));
                    this.speedX = Math.abs(this.speedX) * Math.max(this.bounceness, (obj.bounceness || 0)) >= 0.001 ? this.speedX * Math.max(this.bounceness, (obj.bounceness || 0)) : 0;
                    if (obj.type == TYPE.BOUNCER && Math.abs(this.speedX) < 0.2)
                        this.speedX = this.speedX > 0 ? 0.2 : -0.2;
                } else {
                    this.processActorCollisionX(obj);
                }
            } else {
                if (Math.round((this.y + intersection.height) * 100) / 100 >= Math.round((obj.y + obj.height) * 100) / 100)
                    this.y = obj.y + obj.height;
                else
                    this.y = obj.y - this.height;
                if (Math.abs(this.y - this.lastPosition.y) >= obj.height)
                    this.y = this.lastPosition.y;
            }
            if (obj.interactive) obj.interact(this);
        },
        processActorCollisionX: function (obj) {
            if (this.glove) obj.speedX = Math.abs(this.speedX) > this.accelX ? 0 : this.speedX;
            this.speedX = 0;
        },
        slopeXcollision: function (obj) { },
        resolveForY: function (entitiesToResolve, obj) {
            if (!fg.Game.testOverlap(this, obj)) {
                entitiesToResolve.pop();
                return;
            } else {
                if (!obj.slope)
                    this.nonSlopeYcollision(obj);
                else
                    this.slopeYcollision(obj);

                if (obj.oneWay)
                    entitiesToResolve.pop();
            }
        },
        slopeYcollision: function (obj) {
            var t = (Math.round(this.x + (this.width / 2)) - obj.x) / (fg.System.defaultSide / (obj.rowSize || 1));
            var hitY = (1 - t) * obj.leftY + t * obj.rightY;
            if (this.y + this.height >= hitY) {
                if (!fg.Input.actions["jump"]) this.canJump = true;
                this.speedY = 0;
                this.y = hitY - this.height;
                this.grounded = true;
            }
        },
        resolveNonOneWayYCollision: function (obj) {
            if (this.type == TYPE.ACTOR && obj.type == TYPE.CHECKPOINT) this.lastCheckPoint = obj;
            if (Math.abs(this.speedY) <= fg.Game.gravity) return;
            this.addedSpeedX = this.computeAddedSpeedX((obj.addedSpeedX || obj.speedX) || 0);
            if (this.y <= obj.y)
                this.y = obj.y - this.height;
            else
                this.y = obj.y + obj.height;
            this.speedY = this.speedY * -1;
            if (Math.abs(this.speedY) < 0.03) this.speedY = 0;
            if (obj.active)
                obj.speedY -= this.speedY * Math.max(this.bounceness, (obj.bounceness || 0));
            this.speedY = this.speedY * Math.max(this.bounceness, (obj.bounceness || 0));
            if (obj.bounceness >= 1 && this.speedY < 0 && this.speedY > -(fg.Game.gravity * 2))
                this.speedY = -(fg.Game.gravity * fg.Timer.deltaTime);
            if (obj.lastPosition) {
                if (obj.type == TYPE.CIRCLE) {
                    this.speedX += obj.speedX;
                    obj.speedX = obj.speedX * 0.70749;
                }
            }
            if (obj.interactive) obj.interact(this);
        },
        computeAddedSpeedX: function (newAddedValue) {
            if (newAddedValue == 0) return newAddedValue;
            var multiplyer = Math.min(Math.abs(this.addedSpeedX + this.speedX), Math.abs(newAddedValue)) / Math.max(Math.abs(this.addedSpeedX + this.speedX), Math.abs(newAddedValue));
            if (multiplyer == 0) multiplyer = 0.001;
            if (multiplyer < 0.9 && Math.abs(newAddedValue) > 0.06) return newAddedValue * multiplyer;
            return newAddedValue;
        },
        nonSlopeYcollision: function (obj) {
            if (this.speedY >= 0) {
                if (!fg.Input.actions["jump"])
                    this.canJump = true;
                if (obj.interactive) obj.interact(this);
                this.grounded = true;
            }
            var intersection = this.getIntersection(obj);
            if (intersection.height <= intersection.width) {
                if (!obj.oneWay) {
                    this.resolveNonOneWayYCollision(obj);
                } else {
                    if (obj.interactive) obj.interact(this);
                    if ((this.lastPosition.y + this.height) - (this.lastPosition.speedY * fg.Timer.deltaTime) <= obj.y && this.y + this.height > obj.y) {
                        this.addedSpeedX = this.computeAddedSpeedX((obj.addedSpeedX || obj.speedX) || 0);
                        this.y = obj.y - this.height;
                        this.speedY = this.speedY * -1;
                        this.speedY = this.speedY * this.bounceness;
                    }
                }
            }
            else {
                if (obj.oneWay) return;
                if (this.x <= obj.x)
                    this.x = obj.x - this.width;
                else
                    this.x = obj.x + obj.width;
                if (Math.abs(this.x - this.lastPosition.x) >= obj.width)
                    this.x = this.lastPosition.x;
                this.lastPosition.x = this.x;
            }
        },
        getIntersection: function (obj) {
            var intersection = { x: Math.max(this.x, obj.x), y: Math.max(this.y, obj.y) };
            intersection.width = Math.round((Math.min(this.x + this.width, obj.x + obj.width) - intersection.x) * 1000) / 1000;
            intersection.height = Math.round((Math.min(this.y + this.height, obj.y + obj.height) - intersection.y) * 1000 / 1000);
            return intersection;
        }
    };

fg.Entity = function (id, type, x, y, cx, cy, index) {
    switch (type) {
        case TYPE.WALL:
        case TYPE.GROWER:
        case TYPE.BOUNCER:
        case TYPE.SWITCH:
        case TYPE.PILLAR:
        case TYPE.PLATFORM:
        case TYPE.TUNNEL:
        case TYPE.TURTLE:
        case TYPE.CHECKPOINT:
            return fg.Wall(id, type, x, y, cx, cy, index);
        case TYPE.CRATE:
            return fg.Crate(id, type, x, y, cx, cy, index);
        case TYPE.ACTOR:
            return fg.Actor(id, type, x, y, cx, cy, index);
        case TYPE.SLOPENE://"╗":            
        case TYPE.SLOPESE://"╝":            
        case TYPE.SLOPESW://"╚":            
        case TYPE.SLOPENW://"╔":
            return fg.Slope(id, type, x, y, cx, cy, index);
        case TYPE.CIRCLE:
        case TYPE.WALLJUMP:
        case TYPE.SUPERJUMP:
        case TYPE.LIGHT:
        case TYPE.VELOCITY:
        case TYPE.GLOVE:
            return fg.Circle(id, type, x, y, cx, cy, index);
        case TYPE.MARIO:
            return fg.Mario(id, type, x, y, cx, cy, index);
        case TYPE.SAVE:
            return fg.Save(id, type, x, y, cx, cy, index);
        case TYPE.SENTRY:
            return fg.Sentry(id, type, x, y, cx, cy, index);
        default:
            return Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index);
    }
}

fg.Circle = function (id, type, x, y, cx, cy, index) {
    var circle = Object.create(fg.protoEntity);
    circle.init(id, type, x, y, cx, cy, index);
    if (type == TYPE.CIRCLE) {
        circle = Object.assign(circle, fg.Active);
        circle.soilFriction = 0.999;
        circle.speedX = -0.05;//1.4
        circle.bounceness = 0.7;
        circle.width = fg.System.defaultSide / 2;
        circle.height = fg.System.defaultSide / 2;
    } else {
        circle.width = fg.System.defaultSide / 3;
        circle.height = fg.System.defaultSide / 3;
        Object.assign(circle, fg.Interactive);
        switch (type) {
            case TYPE.WALLJUMP:
                circle.color = 'green';
                break;
            case TYPE.SUPERJUMP:
                circle.color = "brown";
                break;
            case TYPE.LIGHT:
                circle.color = "white";
                break;
            case TYPE.VELOCITY:
                circle.color = "pink";
                break;
            case TYPE.GLOVE:
                circle.color = "orange";
                break;
            default:
                break;
        }
        circle.interact = function () {
            if (this.type == TYPE.GLOVE) {
                fg.Game.actors[0].glove = true;
            } else if (this.type == TYPE.LIGHT) {
                fg.Game.actors[0].light = true;
            } else if (this.type == TYPE.WALLJUMP) {
                fg.Game.actors[0].wallJump = true;
            } else if (this.type == TYPE.SUPERJUMP) {
                fg.Game.actors[0].superJump = true;
            } else if (this.type == TYPE.VELOCITY) {
                fg.Game.actors[0].velocity = true;
            }
            fg.Game.currentLevel.entities[this.id.split("-")[0]][this.id.split("-")[1]] = null;
        }
    }
    circle.drawTile = function (c, ctx) {
        this.cacheWidth = this.width;
        this.cacheHeight = this.height;;
        c.width = this.width * 2;
        c.height = this.height;
        ctx.fillStyle = this.color;
        ctx.arc(this.width / 2, this.height / 2, this.height / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.arc(this.width + (this.width / 2), this.height / 2, this.height / 2, 0, 2 * Math.PI);
        ctx.fill();
        return c;
    }
    return circle;
}

fg.Platform = {
    height: 5,
    oneWay: true
}

fg.Tunnel = {
    backGround: false,
    foreGround: true
}

fg.Bouncer = {
    color: "red",
    bounceness: 1.4
}

fg.Wall = function (id, type, x, y, cx, cy, index) {
    var wall = Object.create(fg.protoEntity);
    wall.init(id, type, x, y, cx, cy, index);
    fg.Game.currentLevel.applyFeaturesToEntity(wall);
    if (type == TYPE.GROWER)
        wall = Object.assign(wall, fg.Interactive, fg.Grower);
    if (wall.type == TYPE.PLATFORM)
        wall = Object.assign(wall, fg.Interactive, fg.Platform, wall.moving ? fg.MovingPlatform : null);
    wall.slope = false;
    wall.backGround = true;
    wall.foreGround = false;
    wall.cacheWidth = wall.width;
    wall.cacheHeight = wall.height;
    if (type == TYPE.BOUNCER) {
        wall = Object.assign(wall, fg.Bouncer);
    }
    wall.drawTile = function (c, ctx) {
        c.width = this.width * 4;
        c.height = this.height * (this.type == TYPE.PLATFORM ? 1 : 4);
        for (var i = 0; i < (this.type == TYPE.PLATFORM ? 2 : 4); i++) {

            var startX = (i == 1 || i == 3 ? this.width : 0);
            var startY = (i == 2 || i == 3 ? this.width : 0);
            var widthMultiplyer = (i == 1 || i == 3 ? 3 : 1);
            var heightMultiplyer = (i == 2 || i == 3 ? 3 : 1);

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.color;
            ctx.rect(startX + .5, startY + .5, (this.width * widthMultiplyer) - 1, (this.height * heightMultiplyer) - 1);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = "grey";
            ctx.rect(startX + 1.5, startY + 1.5, (this.width * widthMultiplyer) - 3, (this.height * heightMultiplyer) - 3);
            ctx.stroke();
            if (this.type == TYPE.TUNNEL)
                ctx.fillStyle = 'rgba(0,0,0,.5)';
            else
                ctx.fillStyle = this.color;
            ctx.fillRect(startX + 2, startY + 2, (this.width * widthMultiplyer) - 4, (this.height * heightMultiplyer) - 4);
        }
        return c;
    };
    if (type == TYPE.SWITCH)
        wall = Object.assign(wall, fg.Interactive, fg.Switch, (wall.moveTarget || wall.growTarget) ? fg.ChangeTarget : null);
    if (type == TYPE.TUNNEL)
        wall = Object.assign(wall, fg.Tunnel);
    fg.Game.currentLevel.applySettingsToEntity(wall);
    return wall;
}

fg.Interactive = {
    interactive: true,
    interacting: false,
    init: function () { },
    interact: function (obj) {
        this.interactor = obj;
        this.interacting = true;
    },
    update: function () {
        this.interacting = false;
        this.interactor = undefined;
    }
}

fg.ChangeTarget = {
    distance: 1,
    direction: "U",
    speed: 0.06,
    moveUp: function () {
        if (!this.target.defaultY) this.target.defaultY = this.target.y;
        if (this.on) {
            if (this.target.y - (this.speed * fg.Timer.deltaTime) > this.target.defaultY - (fg.System.defaultSide * this.distance))
                this.target.y -= this.speed * fg.Timer.deltaTime;//0.2;//0.1;
            else
                this.target.y = this.target.defaultY - (fg.System.defaultSide * this.distance);//0.2;//0.1;
        } else {
            if (this.target.y + (this.speed * fg.Timer.deltaTime) < this.target.defaultY)
                this.target.y += this.speed * fg.Timer.deltaTime;
            else
                this.target.y = this.target.defaultY;
        }
    },
    moveDown: function () {
        if (!this.target.defaultY) this.target.defaultY = this.target.y;
        if (this.on) {
            if (this.target.y + (this.speed * fg.Timer.deltaTime) < this.target.defaultY + (fg.System.defaultSide * this.distance))
                this.target.y += this.speed * fg.Timer.deltaTime;//0.2;//0.1;
            else
                this.target.y = this.target.defaultY + (fg.System.defaultSide * this.distance);//0.2;//0.1;
        } else {
            if (this.target.y - (this.speed * fg.Timer.deltaTime) > this.target.defaultY)
                this.target.y -= this.speed * fg.Timer.deltaTime;
            else
                this.target.y = this.target.defaultY;
        }
    },
    moveLeft: function () {
        if (!this.target.defaultX) this.target.defaultX = this.target.x;
        this.target.addedSpeedX = 0;
        if (this.on) {
            if (this.target.x > this.target.defaultX - (fg.System.defaultSide * this.distance)) {
                this.target.x -= this.speed * fg.Timer.deltaTime;//0.2;//0.1;
                this.target.addedSpeedX = this.speed * -1;
            } else
                this.target.x = this.target.defaultX - (fg.System.defaultSide * this.distance);//0.2;//0.1;
        } else {
            if (this.target.x < this.target.defaultX) {
                this.target.x += this.speed * fg.Timer.deltaTime;
                this.target.addedSpeedX = this.speed;
            } else
                this.target.x = this.target.defaultX;
        }
    },
    moveRight: function () {
        if (!this.target.defaultX) this.target.defaultX = this.target.x;
        this.target.addedSpeedX = 0;
        if (this.on) {
            if (this.target.x < this.target.defaultX + (fg.System.defaultSide * this.distance)) {
                this.target.x += this.speed * fg.Timer.deltaTime;//0.2;//0.1;
                this.target.addedSpeedX = this.speed;
            } else
                this.target.x = this.target.defaultX + (fg.System.defaultSide * this.distance);//0.2;//0.1;
        } else {
            if (this.target.x > this.target.defaultX) {
                this.target.x -= this.speed * fg.Timer.deltaTime;
                this.target.addedSpeedX = this.speed * -1;
            } else
                this.target.x = this.target.defaultX;
        }
    },
    doAction: function () {
        switch (this.direction) {
            case "U":
                this.moveUp();
                break;
            case "D":
                this.moveDown();
                break;
            case "L":
                this.moveLeft();
                break;
            case "R":
                this.moveRight();
                break;
            default:
                break;
        }
    }
}
fg.Switch = {
    on: false,
    defaulState: false,
    foreGround: true,
    target: undefined,
    timed: false,
    timer: undefined,
    defaulTimer: 120,
    canChangeState: true,
    init: function () {
        if (this.targetId) {
            this.target = fg.Game.currentLevel.entities[this.targetId.split('-')[0]][this.targetId.split('-')[1]];
            this.target.drawSegments = this.drawSegments;
            // this.target.oldUpdate = this.target.update;
            // this.target.switch = this;
            // this.target.update = function (bj) {                
            //     if (this.drawSegments) this.drawSegments();
            //     //if(this.oldUpdate) this.oldUpdate.apply(this);
            // }
            this.target.update = (function (original) {
                return function () {
                    if (this.drawSegments) this.drawSegments();
                    original.apply(this);
                }
            })(this.target.update)
        }
        this.timer = this.defaulTimer;
    },
    update: function () {
        if (this.target === undefined) this.init();
        if (this.interacting) {
            if (this.interactor.x >= this.x && this.interactor.x + this.interactor.width <= this.x + this.width) {
                if (this.canChangeState) {
                    this.on = !this.on;
                    this.canChangeState = false;
                }
                if (this.timed) this.timer = this.defaulTimer;
                if (this.pressure) this.on = true;
            }
        } else this.canChangeState = true;

        if (this.timed && this.timer > 0) {
            this.timer--;
            if (this.timer <= 0) this.on = this.defaulState;
        }
        if (this.doAction) this.doAction();
        if (this.growTarget) this.handleYSegments();
        fg.Interactive.update.call(this);
    },
    handleYSegments: function () {
        var size = Math.ceil((this.target.defaultY + this.target.height - this.target.y) / this.target.height) - 1;
        while (this.target.segments.length > size) this.target.segments.pop();
        if (size > 0) {
            for (var i = 0; i < size; i++) {
                if (!this.target.segments[i]) {
                    this.target.segments[i] = Object.create(fg.protoEntity).init(i, this.target.type, this.target.x, this.target.defaultY - (i * this.target.height), 0, ((size == 1 ? 3 : 2) * this.target.height));
                    this.target.segments[i].foreGround = true;//Gambiarra =(
                }
            }
        }
        this.target.cacheY = this.target.segments.length > 0 ? this.height : 0;
    },
    drawSegments: function () {
        for (var i = 0, segment; segment = this.segments[i]; i++)
            fg.Game.foreGroundEntities.push(segment);
    },
    interact: function (obj) {
        fg.Interactive.interact.call(this, obj);
    },
    drawTile: function (c, ctx) {
        c.width = this.width * 3;
        c.height = this.height
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 5, this.width, this.height - 5);
        ctx.fillStyle = "grey";
        ctx.fillRect(1, 6, this.width - 2, this.height - 7);
        ctx.fillStyle = this.color;
        ctx.fillRect(2, 7, this.width - 4, this.height - 9);
        //Green
        ctx.fillStyle = "rgb(0,160,0)";
        ctx.fillRect(this.width, 0, this.width, 5);
        ctx.fillStyle = "rgb(90,255,90)";
        ctx.fillRect(this.width + 1, 0, this.width - 1, 4);
        ctx.fillStyle = "rgb(0,255,0)";
        ctx.fillRect(this.width + 1, 1, this.width - 2, 3);
        //Red
        ctx.fillStyle = "rgb(160,0,0)";
        ctx.fillRect((this.width * 2), 0, this.width, 5);
        ctx.fillStyle = "rgb(255,90,90)";
        ctx.fillRect((this.width * 2) + 1, 0, this.width - 1, 4);
        ctx.fillStyle = "rgb(255,0,0)";
        ctx.fillRect((this.width * 2) + 1, 1, this.width - 2, 3);
        //ctx.fillRect(this.width * 2, 0, this.width, 5);
        return c;
    },
    draw: function (foreGround) {
        if (foreGround) {
            if (this.on)
                this.cacheX = this.width;
            else
                this.cacheX = this.width * 2;
        } else
            this.cacheX = 0

        fg.protoEntity.draw.call(this, foreGround);
    }
}

fg.Mario = function (id, type, x, y, cx, cy, index) {
    return Object.assign(
        Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index), {
            cacheX: 0,//Math.round(Math.random() * 4) * fg.System.defaultSide,//cacheX: fg.System.defaultSide * 0,
            edges: undefined,
            tileSet: "",
            cachePosition: [{ x: 12, y: 0 }, { x: 12, y: 12 }, { x: 0, y: 12 }, { x: 0, y: 0 }],
            drawTile: function (c, ctx) {
                c.width = this.width * (5 + Object.keys(fg.Render.marioCache).length);
                c.height = this.height;
                var colorA = "rgb(201,152,86)";
                ctx.fillStyle = colorA;
                ctx.fillRect(0, 0, 72, 24);
                ctx.fillRect(79, 7, 10, 10);
                ctx.fillRect(96, 0, 24, 24);
                //draw speckles
                this.speckles(ctx);
                //draw sides tiles
                this.sides(ctx);
                //draw inner corners
                this.innerCorners(ctx);
                //draw outer corners
                this.outerCorners(ctx);
                //mirror sides
                ctx.save();
                ctx.translate(c.width - (fg.System.defaultSide * ((5 + Object.keys(fg.Render.marioCache).length) - 6)), 0);
                ctx.scale(-1, 1);
                this.sides(ctx);
                ctx.restore();

                for (var i = 0, key; key = Object.keys(fg.Render.marioCache)[i]; i++) {
                    //ctx.drawImage(this.renderSubTile(c, key), fg.Render.marioCache[key], 0);
                    this.renderSubTile(ctx, key);
                }

                return c;
            },
            update: function () {
                if (this.tileSet == "") this.setSubTiles(true);
            },/*
            draw: function (foreGround) {
                if (this.tileSet == "") return;
                fg.protoEntity.draw.call(this, foreGround);
            },*/
            setEdges: function () {
                this.edges = [];
                var i = parseInt(this.id.split('-')[0]), k = parseInt(this.id.split('-')[1]);
                var objs = fg.Game.currentLevel.entities;
                this.edges.push(objs[i - 1][k + 0] && objs[i - 1][k + 0].type == TYPE.MARIO && !objs[i - 1][k + 0].vanished ? 1 : 0);
                this.edges.push(objs[i - 1][k + 1] && objs[i - 1][k + 1].type == TYPE.MARIO && !objs[i - 1][k + 1].vanished ? 1 : 0);
                this.edges.push(objs[i - 0][k + 1] && objs[i - 0][k + 1].type == TYPE.MARIO && !objs[i - 0][k + 1].vanished ? 1 : 0);
                this.edges.push(objs[i + 1][k + 1] && objs[i + 1][k + 1].type == TYPE.MARIO && !objs[i + 1][k + 1].vanished ? 1 : 0);
                this.edges.push(objs[i + 1][k + 0] && objs[i + 1][k + 0].type == TYPE.MARIO && !objs[i + 1][k + 0].vanished ? 1 : 0);
                this.edges.push(objs[i + 1][k - 1] && objs[i + 1][k - 1].type == TYPE.MARIO && !objs[i + 1][k - 1].vanished ? 1 : 0);
                this.edges.push(objs[i - 0][k - 1] && objs[i - 0][k - 1].type == TYPE.MARIO && !objs[i - 0][k - 1].vanished ? 1 : 0);
                this.edges.push(objs[i - 1][k - 1] && objs[i - 1][k - 1].type == TYPE.MARIO && !objs[i - 1][k - 1].vanished ? 1 : 0);
            },
            getSubTiles: function (tileA, tileB, tileC, index) {
                if (tileA == 1 && tileB == 1 && tileC == 1)
                    return "0" + index;
                else if (tileA == 1 && tileB == 0 && tileC == 1)
                    return "2" + (2 + index) % 4;
                else if (tileA == 1 && tileC == 0)
                    return "4" + index;
                else if (tileA == 0 && tileC == 1)
                    return "1" + index;
                else
                    return "3" + index;
            },
            setSubTiles: function (setCacheX) {
                this.setEdges();
                this.tileSet = "";
                for (var i = 0; i <= 6; i += 2)
                    this.tileSet += this.getSubTiles(this.edges[i], this.edges[i + 1], (this.edges[i + 2] === undefined ? this.edges[0] : this.edges[i + 2]), i / 2);
                if (setCacheX)
                    this.cacheX = fg.Render.marioCache[this.tileSet];
            },
            renderSubTile: function (ctx, key) {
                // fg.Render.offScreenRender().width = fg.System.defaultSide;
                // for (var i = 0; i <= 6; i += 2) {
                //     var cacheX = (parseInt(tileSet[i]) * fg.System.defaultSide) + parseInt(this.cachePosition[tileSet[i + 1]].x);
                //     var cacheY = parseInt(this.cachePosition[tileSet[i + 1]].y);
                //     var cacheWidth = fg.System.defaultSide / 2;
                //     var cacheHeight = fg.System.defaultSide / 2;
                //     fg.Render.drawOffScreen(c, cacheX, cacheY, cacheWidth, cacheHeight, this.cachePosition[i / 2].x, this.cachePosition[i / 2].y);
                // }
                // return fg.Render.offScreenRender();
                var posX = fg.Render.marioCache[key];
                for (var i = 0; i <= 6; i += 2) {
                    var cacheX = (parseInt(key[i]) * fg.System.defaultSide) + parseInt(this.cachePosition[key[i + 1]].x);
                    var cacheY = parseInt(this.cachePosition[key[i + 1]].y);
                    var cacheWidth = fg.System.defaultSide / 2;
                    var cacheHeight = fg.System.defaultSide / 2;
                    ctx.drawImage(ctx.canvas, cacheX, cacheY, cacheWidth, cacheHeight, posX + this.cachePosition[i / 2].x, this.cachePosition[i / 2].y, 12, 12);
                }
            },
            drawColor: function (ctx, t_x, t_y, t_w, t_h, color) {
                ctx.fillStyle = color;
                for (var index = 0; index < t_x.length; index++)
                    ctx.fillRect(t_x[index], t_y[index], t_w[index], t_h[index]);
            },
            sides: function (ctx) {
                var colorOne = "rgb(120,105,24)";//DarkBrown
                var t_x = [24, 29, 30, 31, 36, 40, 41, 41],
                    t_y = [17, 0, 7, 16, 6, 12, 5, 17],
                    t_w = [7, 2, 2, 5, 5, 2, 7, 2],
                    t_h = [2, 7, 5, 2, 2, 5, 2, 7];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorOne);
                var colorTwo = "rgb(0,201,1)";//LightGreen
                t_x = [24, 25, 36, 43];
                t_y = [19, 0, 1, 12];
                t_w = [12, 4, 12, 4];
                t_h = [4, 12, 4, 12];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorTwo);
                var colorThree = "rgb(0,120,72)";//DarkGreen
                t_x = [24, 27, 27, 28, 28, 28, 29, 30, 32, 35, 36, 37, 40, 42, 42, 43, 43, 43, 44, 45];
                t_y = [19, 3, 20, 0, 6, 11, 8, 19, 18, 19, 4, 5, 4, 3, 13, 12, 16, 21, 18, 4];
                t_w = [3, 1, 3, 1, 1, 1, 1, 2, 3, 1, 1, 3, 2, 3, 1, 1, 1, 1, 1, 3];
                t_h = [1, 3, 1, 3, 2, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 2, 3, 3, 1];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorThree);
                var colorFour = "rgb(0,0,0)";//Black
                t_x = [24, 24, 24, 27, 28, 29, 29, 29, 30, 30, 32, 35, 36, 36, 37, 40, 41, 42, 42, 42, 42, 43, 45, 47];
                t_y = [0, 18, 23, 19, 3, 0, 6, 11, 8, 18, 17, 18, 0, 5, 6, 5, 13, 4, 12, 16, 21, 18, 5, 12];
                t_w = [1, 3, 12, 3, 1, 1, 1, 1, 1, 2, 3, 1, 12, 1, 3, 2, 1, 3, 1, 1, 1, 1, 3, 1];
                t_h = [12, 1, 1, 1, 3, 3, 2, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 2, 3, 3, 1, 12];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorFour);
            },
            innerCorners: function (ctx) {
                var colorOne = "rgb(120,105,24)";//DarkBrown
                var t_x = [54, 55, 53, 58, 59, 66,],
                    t_y = [7, 6, 10, 18, 5, 11,],
                    t_w = [12, 10, 1, 3, 3, 1,],
                    t_h = [10, 12, 3, 1, 1, 3,];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorOne);
                var colorTwo = "rgb(0,201,1)";//LightGreen
                t_x = [56];
                t_y = [8];
                t_w = [8];
                t_h = [8];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorTwo);
                var colorThree = "rgb(0,120,72)";//DarkGreen
                t_x = [55, 56, 56, 57, 57, 59, 59, 61, 61, 63, 63, 64];
                t_y = [11, 8, 13, 8, 15, 7, 16, 8, 15, 8, 13, 11];
                t_w = [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1];
                t_h = [2, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorThree);
                var colorFour = "rgb(0,0,0)";//Black
                t_x = [54, 55, 55, 56, 56, 59, 59, 61, 61, 64, 64, 65];
                t_y = [11, 8, 13, 7, 16, 6, 17, 7, 16, 8, 13, 11];
                t_w = [1, 1, 1, 3, 3, 2, 2, 3, 3, 1, 1, 1];
                t_h = [2, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorFour);
            },
            outerCorners: function (ctx) {
                var colorOne = "rgb(120,105,24)";//DarkBrown
                var t_x = [77, 77, 79, 83, 88, 89, 85, 79, 79, 84, 88, 82],
                    t_y = [5, 11, 16, 17, 13, 7, 5, 5, 12, 16, 10, 7],
                    t_w = [3, 2, 4, 6, 3, 2, 4, 6, 1, 2, 1, 2],
                    t_h = [6, 6, 3, 2, 4, 6, 3, 2, 2, 1, 2, 1];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorOne);
                var colorTwo = "rgb(0,0,0)";//Black
                t_x = [72, 73, 74, 74, 76, 76, 89, 89, 91, 91, 77, 77, 80, 82, 84, 86, 90, 90];
                t_y = [4, 2, 1, 17, 0, 19, 1, 17, 2, 4, 8, 12, 18, 5, 18, 5, 10, 14];
                t_w = [5, 4, 5, 5, 16, 16, 5, 5, 4, 5, 1, 1, 2, 2, 2, 2, 1, 1];
                t_h = [16, 20, 6, 6, 5, 5, 6, 6, 20, 16, 2, 2, 1, 1, 1, 1, 2, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorTwo);
                var colorThree = "rgb(0,120,72)";//DarkGreen
                t_x = [76, 75, 76, 78, 78, 90, 90, 92, 76, 76, 80, 82, 84, 86, 91, 91];
                t_y = [4, 6, 18, 20, 3, 4, 18, 6, 8, 12, 19, 4, 19, 4, 10, 14];
                t_w = [2, 1, 2, 12, 12, 2, 2, 1, 1, 1, 2, 2, 2, 2, 1, 1];
                t_h = [2, 12, 2, 1, 1, 2, 2, 12, 2, 2, 1, 1, 1, 1, 2, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorThree);
                var colorFour = "rgb(0,201,1)";//LightGreen
                t_x = [74, 73, 74, 76, 91, 93, 91, 76, 75, 75, 75, 75, 77, 80, 84, 90, 92, 92, 92, 92, 90, 86, 82, 77];
                t_y = [2, 4, 19, 21, 19, 4, 2, 1, 5, 8, 12, 18, 20, 20, 20, 20, 18, 14, 10, 5, 3, 3, 3, 3];
                t_w = [3, 2, 3, 16, 3, 2, 3, 16, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1];
                t_h = [3, 16, 3, 2, 3, 16, 3, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorFour);
            },
            speckles: function (ctx) {
                var colorB = "rgba(224,190,80,1)";
                var t_x = [3, 6, 8, 8, 13, 15, 15, 16, 18, 20],
                    t_y = [8, 11, 5, 17, 14, 2, 20, 8, 14, 4],
                    t_w = [1, 2, 2, 1, 1, 1, 1, 2, 2, 1],
                    t_h = [3, 3, 3, 3, 2, 3, 2, 3, 3, 2];
                ctx.fillStyle = colorB;
                for (var t = 0; t < 5; t++)
                    for (var index = 0; index < 10; index++)
                        ctx.fillRect(t_x[index] + (t * this.width), t_y[index], t_w[index], t_h[index]);
            }
        });
}

fg.MovingPlatform = {
    loop: false,
    path: undefined,
    hovering: 0,
    hoverTime: 120,
    movingSpeed: 0.06,//0.06
    nextPosition: {},
    iterator: 1,
    currentIndex: 0,
    speedX: 0,
    init: function () {
        if (!this.path) {
            this.path = [];
            if (this.movingOnX) {
                this.path.push({ x: this.x - (fg.System.defaultSide * 3), y: this.y });
                this.path.push({ x: this.x + (fg.System.defaultSide * 3), y: this.y });
            } else {
                this.path.push({ x: this.x, y: this.y - (fg.System.defaultSide * 1) });
                this.path.push({ x: this.x, y: this.y + (fg.System.defaultSide * 1) });
            }
            this.movingSpeed *= -1;
            this.nextPosition = this.path[0];
        }
        if (this.segments.length > 0)
            for (var i = 0, segment; segment = this.segments[i]; i++)
                fg.Game.currentLevel.entities[segment.l][segment.c].interact = this.interact;
    },
    setNextPosition: function () {
        this.currentIndex = this.path.indexOf(this.nextPosition);
        if (this.currentIndex + this.iterator >= this.path.length || this.currentIndex + this.iterator <= 0) {
            if (this.loop) {
                this.currentIndex = 0;
                this.nextPosition = this.path[this.currentIndex];
            }
            else {
                this.iterator *= -1;
                this.nextPosition = this.path[this.currentIndex + this.iterator];
            }
        } else {
            this.nextPosition = this.path[this.currentIndex + this.iterator];
        }
        if (this.movingOnX) {
            if ((this.nextPosition.x > this.x && this.movingSpeed < 0) || (this.nextPosition.x < this.x && this.movingSpeed > 0))
                this.movingSpeed *= -1;
        } else {
            if ((this.nextPosition.y > this.y && this.movingSpeed < 0) || (this.nextPosition.y < this.y && this.movingSpeed > 0))
                this.movingSpeed *= -1;
        }

        if (this.hoverTime > 0)
            this.hovering = this.hoverTime;
    },
    update: function () {
        if (!this.path) this.init();
        if (this.hovering > 0) {
            this.speedX = 0;
            this.updateSegments();
            this.hovering--;
            return;
        }
        if (this.movingOnX)
            this.moveOnX();
        else
            this.moveOnY();
        this.speedX = this.movingSpeed;
        this.updateSegments();
    },
    updateSegments: function () {
        if (this.segments.length > 0)
            for (var i = 0, segment; segment = this.segments[i]; i++) {
                var sgmt = fg.Game.currentLevel.entities[segment.l][segment.c];
                if (this.movingOnX)
                    sgmt.x = this.x + (sgmt.index * fg.System.defaultSide);
                else
                    sgmt.y = this.y;
                sgmt.speedX = this.speedX;
                sgmt.hovering = this.hovering;
                sgmt.movingOnX = this.movingOnX;
            }
    },
    moveOnX: function () {
        this.movingOnX = true;
        this.x += this.movingSpeed * fg.Timer.deltaTime;
        if ((this.movingSpeed < 0 && this.x <= this.nextPosition.x) || (this.movingSpeed > 0 && this.x >= this.nextPosition.x)) {
            this.x = this.nextPosition.x;
            this.setNextPosition();
        }
    },
    moveOnY: function () {
        this.movingOnX = false;
        this.y += this.movingSpeed * fg.Timer.deltaTime;
        if ((this.movingSpeed < 0 && this.y <= this.nextPosition.y) || (this.movingSpeed > 0 && this.y >= this.nextPosition.y)) {
            this.y = this.nextPosition.y;
            this.setNextPosition();
        }
    },
    interact: function (obj) {
        if (this.hovering == 0) {
            if (!this.movingOnX)
                obj.y = this.y - (obj.height + 1);
        }
    }
}

fg.Grower = {
    defaultGrowTimer: 60,
    growTimer: undefined,
    defaultShrinkTimer: 60,
    shrinkTimer: undefined,
    maxGrowth: 2,
    growthSpeed: 0.06,
    defaultY: undefined,
    interactor: null,
    init: function () {
        this.growTimer = this.defaultGrowTimer;
        this.shrinkTimer = this.defaultShrinkTimer;
        this.defaultY = this.y;
    },
    interact: function (obj) {
        fg.Interactive.interact.call(this, obj);
        if (this.growTimer > 0) {
            this.growTimer--;
            this.shrinkTimer = this.defaultShrinkTimer;
        }
    },
    update: function () {
        if (this.growTimer === undefined) this.init();
        if (this.interacting && this.interactor.x >= this.x && this.interactor.x + this.interactor.width <= this.x + this.width) {
            if (this.growTimer <= 0) {
                if (this.y > this.defaultY - ((this.maxGrowth * fg.System.defaultSide) - fg.System.defaultSide))
                    this.y -= (this.growthSpeed * fg.Timer.deltaTime);
                else
                    this.y = this.defaultY - ((this.maxGrowth * fg.System.defaultSide) - fg.System.defaultSide);
            }
        } else {
            if (this.growTimer < this.defaultGrowTimer)
                this.growTimer++;
            else
                this.growTimer = this.defaultGrowTimer

            if (this.shrinkTimer <= 0 && this.y != this.defaultY) {
                if (this.y < this.defaultY) {
                    this.y += (this.growthSpeed * fg.Timer.deltaTime);
                } else {
                    this.shrinkTimer = this.defaultShrinkTimer;
                    this.y = this.id.split('-')[0] * fg.System.defaultSide;
                }
            }
            if (this.shrinkTimer > 0) this.shrinkTimer--;
        }
        fg.Interactive.update.call(this);
    }
}

fg.Save = function (id, type, x, y, cx, cy, index) {
    return Object.assign(Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index), fg.Interactive, {
        animationIndex: 0,
        tunning: 0,
        defaultTunning: 180,
        drawTile: function (c, ctx) {
            var imageData = null;
            var data = null;
            c.width = this.width * 6;
            c.height = this.height;
            for (var index = 0; index <= 5; index++) {
                var offSetX = this.width * index;
                ctx.fillStyle = "black";
                ctx.fillRect(offSetX + 0, 0, this.width, this.height);
                ctx.fillStyle = "#995006";
                ctx.fillRect(offSetX + 1, 1, this.width - 2, this.height - 2);
                ctx.fillStyle = "#565656";
                ctx.fillRect(offSetX + 1, 18, 22, 5);
                ctx.fillStyle = "#060D99";
                ctx.fillRect(offSetX + 2, 20, 4, 1);
                ctx.fillRect(offSetX + 3, 19, 2, 3);
                ctx.fillRect(offSetX + 18, 20, 4, 1);
                ctx.fillRect(offSetX + 19, 19, 2, 3);
                ctx.fillStyle = "white";
                ctx.fillRect(offSetX + 2, 2, 20, 15);
                imageData = ctx.getImageData(offSetX + 2, 2, 20, 15);
                data = imageData.data;
                for (var i = 0; i < data.length; i += 4) {
                    if (Math.round(Math.random())) continue;
                    data[i] = 0;     // red
                    data[i + 1] = 0; // green
                    data[i + 2] = 0; // blue
                }
                ctx.putImageData(imageData, offSetX + 2, 2);
            }

            return c;
        },
        update: function () {
            this.cacheX = this.animationIndex * this.width;
            this.animationIndex = this.animationIndex + 1 < 6 ? this.animationIndex + 1 : 0;
        },
        interact: function(entity){
            if(entity.type == TYPE.ACTOR){

            }
        }
    });
}

fg.Sentry = function (id, type, x, y, cx, cy, index) {
    return fg.Game.currentLevel.applySettingsToEntity(
        Object.assign(Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index), {
            attached: false,
            moving: true,
            rotation: 0,
            speedX: 0,
            speedY: 0,
            vectorList: [],
            width: fg.System.defaultSide / 2,
            height: fg.System.defaultSide / 2,
            searchDepth: 1,
            wait: 0,
            aim: 0,
            active: true,
            curAngle: 0,
            castAngle: 0,
            maxAim: 120,
            maxWait: 120,
            currentEntities: [],
            laserPoint: { x: 0, y: 0 },
            actorBeams: [],
            stationary: false,
            drawTile: function (c, ctx) {
                c.width = this.width;
                c.height = this.height;
                ctx.fillStyle = "#54A6BF";
                ctx.arc(this.width / 2, this.height / 2, this.height / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = "#407B95";
                ctx.stroke();
                return c;
            },
            getVectors: function (entities) {
                this.vectorList = [];
                for (var i = 0, entity; entity = entities[i]; i++) {
                    if (entity.id == this.id) continue;
                    if (!entity.vectors) {
                        entity.vectors = [];
                        entity.vectors[entity.vectors.length] = { type: entity.type, id: entity.id + "-T", a: { x: entity.x, y: entity.y }, b: { x: entity.x + entity.width, y: entity.y } };
                        entity.vectors[entity.vectors.length] = { type: entity.type, id: entity.id + "-R", a: { x: entity.x + entity.width, y: entity.y }, b: { x: entity.x + entity.width, y: entity.y + entity.height } };
                        entity.vectors[entity.vectors.length] = { type: entity.type, id: entity.id + "-B", a: { x: entity.x, y: entity.y + entity.height }, b: { x: entity.x + entity.width, y: entity.y + entity.height } };
                        entity.vectors[entity.vectors.length] = { type: entity.type, id: entity.id + "-L", a: { x: entity.x, y: entity.y }, b: { x: entity.x, y: entity.y + entity.height } };
                    }
                    for (var k = 0; k < entity.vectors.length; k++)
                        this.vectorList.push(entity.vectors[k]);
                }
            },
            checkCollisions: function () {
                var entities = fg.Game.searchArea(this.x + (this.width / 2), this.y + (this.height / 2), this.searchDepth, Math.round(this.searchDepth * (fg.System.canvas.height / fg.System.canvas.width)));
                for (var k = 0; k < 6; k++) {
                    if (k == 0)
                        this.rotation -= 90;
                    else
                        this.rotation += 90;
                    if (this.rotation < 0) this.rotation = 360 + this.rotation;
                    if (this.rotation == 360) this.rotation = 0;
                    this.addSpeed();
                    if (!this.resolveCollision(entities)) if (this.attached) return;
                }
            },
            resolveCollision: function (ents) {
                for (var i = 0, obj; obj = ents[i]; i++) {
                    if (fg.Game.testOverlap({ id: this.id, x: this.x + this.speedX, y: this.y + this.speedY, width: this.width, height: this.height }, obj)) {
                        if (this.speedX != 0) {
                            if (this.speedX > 0)
                                this.x = obj.x - this.width;
                            else
                                this.x = obj.x + obj.width;
                        } else {
                            if (this.speedY > 0)
                                this.y = obj.y - this.height;
                            else
                                this.y = obj.y + obj.height;
                        }
                        this.attached = true;
                        return true;
                    }
                }
                return false;
            },
            addSpeed: function () {
                this.speedX = 0;
                this.speedY = 0;
                var vel = 0.03 * fg.Timer.deltaTime;
                switch (this.rotation) {
                    case 0:
                        this.speedX = vel;
                        break;
                    case 90:
                        this.speedY = vel;
                        break;
                    case 180:
                        this.speedX = -vel;
                        break;
                    case 270:
                        this.speedY = -vel;
                        break;
                }
            },
            searchArea: function (actor) {
                this.currentEntities = [];
                var startCol = Math.floor(Math.min(this.laserPoint.x / fg.System.defaultSide, (this.x + (this.width / 2)) / fg.System.defaultSide));
                var startRow = Math.floor(Math.min(this.laserPoint.y / fg.System.defaultSide, (this.y + (this.height / 2)) / fg.System.defaultSide));
                var endCol = Math.ceil(Math.max(this.laserPoint.x / fg.System.defaultSide, (this.x + (this.width / 2)) / fg.System.defaultSide));
                var endRow = Math.ceil(Math.max(this.laserPoint.y / fg.System.defaultSide, (this.y + (this.height / 2)) / fg.System.defaultSide));
                var startRowIndex = startRow < 0 ? 0 : startRow;
                var endRowIndex = endRow > fg.Game.currentLevel.entities.length ? fg.Game.currentLevel.entities.length : endRow;
                var startColIndex = startCol < 0 ? 0 : startCol;
                var endColIndex = endCol > fg.Game.currentLevel.entities[0].length ? fg.Game.currentLevel.entities[0].length : endCol;

                for (var i = (endRowIndex - 1); i >= startRowIndex; i--) {
                    for (var k = startColIndex, obj; k <= endColIndex; k++) {
                        var obj = fg.Game.currentLevel.entities[i][k];
                        if (!obj || obj.type == TYPE.DARKNESS || obj.type == TYPE.TUNNEL || obj.vanished) continue;
                        this.currentEntities.push(obj);
                        if (obj.target && obj.target.segments)
                            for (var index = 0, entity; entity = obj.target.segments[index]; index++)
                                this.currentEntities.push(entity);
                    }
                }
                if (!actor.vanished) this.currentEntities.push(actor);
            },
            updateVectors: function (actor) {
                if (actor && !actor.vanished && this.aim < (this.maxAim * 0.8) && this.wait == 0) {
                    this.laserPoint.x = (actor.x + (actor.width / 2));
                    this.laserPoint.y = (actor.y + (actor.height / 2));
                }
                this.searchArea(actor);
                this.getVectors(this.currentEntities);
            },
            laserFinalMoments: function () {
                var count = 0;
                var targetDistance = Math.sqrt(Math.pow((this.y + (this.height / 2)) - this.laserPoint.y, 2) + Math.pow((this.x + (this.width / 2)) - this.laserPoint.x, 2));
                while (this.castRay(this.shootAngle) && targetDistance < (fg.System.canvas.width)) {
                    this.laserPoint.x = this.laserPoint.x + Math.cos(this.shootAngle * Math.PI / 180) * (targetDistance + 4);
                    this.laserPoint.y = this.laserPoint.y + Math.sin(this.shootAngle * Math.PI / 180) * (targetDistance + 4);
                    this.updateVectors(fg.Game.actors[0]);
                    count++;
                    if (count > 40)
                        return;
                }
            },
            search: function () {
                this.updateVectors(fg.Game.actors[0]);
                if (this.wait == 0) {
                    if (this.active) this.moving = true;
                    if (this.aim < (this.maxAim * 0.8)) {
                        var segValue = 12;
                        var searchAngle = 360 / segValue;
                        this.curAngle = Math.round(Math.atan2((fg.Game.actors[0].y + (fg.Game.actors[0].height / 2)) - (this.y + (this.height / 2)), (fg.Game.actors[0].x + fg.Game.actors[0].width / 2) - (this.x + (this.width / 2))) * 180 / Math.PI) - (searchAngle / 2);
                        this.actorBeams = [];
                        for (var i = (this.castAngle * searchAngle) + this.curAngle; i < ((this.castAngle * searchAngle) + searchAngle) + this.curAngle; i += (this.aim == 0 ? 2 : 1)) {
                            this.castRay(i % 360);
                        }
                        if (this.actorBeams.length > 0) {
                            var beam = this.actorBeams[Math.floor(this.actorBeams.length / 2)];
                            this.aiming(beam.intersect);
                            this.drawTargetCircle(beam.intersect);
                            this.moving = false;
                            this.shootAngle = beam.angle;
                        }
                        if (this.aim > 0) {
                            var resultAngle = this.shootAngle - (searchAngle / 2);
                            this.curAngle = (resultAngle >= 0 ? resultAngle : 360 + resultAngle);
                        }
                    } else this.laserFinalMoments();

                    if (this.moving) this.aim = 0;
                } else {
                    this.castRay(this.shootAngle);
                    this.wait--;
                }
            },
            castRay: function (angle) {
                var endCastX = Math.cos(angle * Math.PI / 180) * (fg.System.canvas.width / 4);
                var endCastY = Math.sin(angle * Math.PI / 180) * (fg.System.canvas.width / 4);
                var ray = {
                    a: { x: this.x + (this.width / 2), y: this.y + (this.height / 2) },
                    b: { x: this.x + endCastX, y: this.y + endCastY }
                };
                //debug
                //this.drawLaser(ray.b);

                // Find CLOSEST intersection
                var closestIntersect = null;
                for (var i = 0; i < this.vectorList.length; i++) {
                    var intersect = this.getIntersection(ray, this.vectorList[i]);
                    if (!intersect) continue;
                    if (!closestIntersect || intersect.param < closestIntersect.param) {
                        closestIntersect = intersect;
                    }
                }
                var intersect = closestIntersect;

                if (!intersect) return true;

                //debug
                //this.drawLaser(intersect);

                if ((intersect.type == TYPE.ACTOR || this.aim >= (this.maxAim * 0.8) || this.wait > 0) && intersect.param <= 3.75) {
                    if (this.aim < (this.maxAim * 0.8) && this.wait == 0)
                        this.actorBeams.push({ angle: angle, intersect: intersect });
                    else {
                        this.aiming(intersect);
                        this.drawTargetCircle(intersect);
                        this.moving = false;
                        this.shootAngle = angle;
                        return false;
                    }
                }

                return true;
            },
            aiming: function (intersect) {
                var ctx = fg.System.context;
                if (this.aim <= (this.maxAim * 0.8))
                    ctx.lineWidth = 1;
                else
                    ctx.lineWidth = 2;

                if (this.maxAim == this.aim || this.wait > 60) {
                    // Draw red laser
                    this.drawLaser(intersect);

                    if (this.wait == 0) this.wait = this.maxWait;

                    this.aim = 0;
                    if (intersect.type == TYPE.ACTOR) fg.Game.actors[0].life = 0;

                    if (intersect.type == TYPE.MARIO) {
                        var objX = parseInt(intersect.id.split("-")[0]);
                        var objY = parseInt(intersect.id.split("-")[1]);
                        if (this.wait <= 61) {
                            fg.Game.currentLevel.entities[objX][objY].vanished = 20000;
                            this.vanish(intersect);
                            if (fg.Game.currentLevel.entities[objX][objY].ID == "17-86")
                                camera.fixed = false;
                        }
                    }
                }
            },
            drawTargetCircle: function (intersect) {
                var ctx = fg.System.context;
                ctx.strokeStyle = "#dd3838";
                ctx.beginPath();
                ctx.arc(intersect.x - fg.Game.screenOffsetX, intersect.y - fg.Game.screenOffsetY, 1, 0, 2 * Math.PI, false);
                ctx.stroke();
                if (this.maxAim != this.aim && this.wait == 0) {
                    ctx.beginPath();
                    ctx.arc(intersect.x - fg.Game.screenOffsetX, intersect.y - fg.Game.screenOffsetY, this.maxAim - this.aim, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    this.aim++;
                }
            },
            drawLaser: function (intersect) {
                var ctx = fg.System.context;
                // Draw red laser
                ctx.save();
                ctx.strokeStyle = "#dd3838";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x - fg.Game.screenOffsetX + (this.width / 2), this.y - fg.Game.screenOffsetY + (this.height / 2));
                ctx.lineTo(intersect.x - fg.Game.screenOffsetX, intersect.y - fg.Game.screenOffsetY);
                ctx.stroke();
                ctx.restore();
            },
            vanish: function (intersect) {
                var entities = fg.Game.currentLevel.entities;
                var tempX = intersect ? intersect.id.split("-")[0] : this.id.split("-")[0];
                var tempY = intersect ? intersect.id.split("-")[1] : this.id.split("-")[1];

                var objX = parseInt(tempX);
                var objY = parseInt(tempY);

                if (entities[objX - 1][objY + 0] && entities[objX - 1][objY + 0].type == TYPE.MARIO) entities[objX - 1][objY + 0].tileSet = "";
                if (entities[objX - 1][objY + 1] && entities[objX - 1][objY + 1].type == TYPE.MARIO) entities[objX - 1][objY + 1].tileSet = "";
                if (entities[objX - 0][objY + 1] && entities[objX - 0][objY + 1].type == TYPE.MARIO) entities[objX - 0][objY + 1].tileSet = "";
                if (entities[objX + 1][objY + 1] && entities[objX + 1][objY + 1].type == TYPE.MARIO) entities[objX + 1][objY + 1].tileSet = "";
                if (entities[objX + 1][objY + 0] && entities[objX + 1][objY + 0].type == TYPE.MARIO) entities[objX + 1][objY + 0].tileSet = "";
                if (entities[objX + 1][objY - 1] && entities[objX + 1][objY - 1].type == TYPE.MARIO) entities[objX + 1][objY - 1].tileSet = "";
                if (entities[objX - 0][objY - 1] && entities[objX - 0][objY - 1].type == TYPE.MARIO) entities[objX - 0][objY - 1].tileSet = "";
                if (entities[objX - 1][objY - 1] && entities[objX - 1][objY - 1].type == TYPE.MARIO) entities[objX - 1][objY - 1].tileSet = "";
            },
            getIntersection: function getIntersection(ray, vector) {
                var r_px = ray.a.x;
                var r_py = ray.a.y;
                var r_dx = ray.b.x - ray.a.x;
                var r_dy = ray.b.y - ray.a.y;

                var s_px = vector.a.x;
                var s_py = vector.a.y;
                var s_dx = vector.b.x - vector.a.x;
                var s_dy = vector.b.y - vector.a.y;

                // Are they parallel? If so, no intersect
                /*if (Math.atan2(r_dy, r_dx) == Math.atan2(s_dy, s_dx)) return null;*/
                if (r_dy == s_dy || r_dx == s_dx) return null;

                // SOLVE FOR T1 & T2
                var T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
                var T1 = (s_px + s_dx * T2 - r_px) / r_dx;

                if (isNaN(T1)) T1 = (s_py + s_dy * T2 - r_py) / r_dy;

                // Must be within parametic whatevers for RAY/SEGMENT
                if (T1 < 0) return null;
                if (T2 < 0 || T2 > 1) return null;

                // Return the POINT OF INTERSECTION
                return {
                    x: r_px + r_dx * T1,
                    y: r_py + r_dy * T1,
                    param: T1,
                    type: vector.type,
                    id: vector.id
                };
            },
            update: function () {
                if (this.moving && !this.stationary) {
                    this.checkCollisions();
                    switch (this.rotation) {
                        case 0:
                        case 180:
                            this.x += this.speedX
                            break;
                        case 90:
                        case 270:
                            this.y += this.speedY;
                            break;
                    }
                }
                this.search();
            }
        }));
}

fg.Slope = function (id, type, x, y, cx, cy, index) {
    var slope = Object.create(fg.protoEntity);
    slope.init(id, type, x, y, cx, cy, index);
    slope.slope = true;
    slope.backGround = true;
    slope.drawTile = function (c, ctx) {
        c.width = this.width * 15;
        c.height = this.height;
        ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = this.color;
        if (this.type == TYPE.SLOPENE) {//╗
            slope.drawNE(ctx);
        } else if (this.type == TYPE.SLOPESE) {//╝
            ctx.moveTo(0, 0);
            ctx.lineTo(this.width, 0);
            ctx.lineTo(0, this.height);
        } else if (this.type == TYPE.SLOPESW) {//╚
            ctx.moveTo(0, 0);
            ctx.lineTo(this.width, 0);
            ctx.lineTo(this.width, this.height);
        } else if (this.type == TYPE.SLOPENW) {//╔
            slope.drawNW(ctx);
        }
        ctx.fill();

        return c;
    };
    slope.drawNE = function (ctx) {
        var height = 0, width = 0;
        for (var i = 0; i < 6; i++) {
            width += i * this.width;
            ctx.moveTo(width, 0);
            ctx.lineTo(width, this.height);
            ctx.lineTo(width + this.width * (i + 1), this.height);
        }
    };
    slope.drawNW = function (ctx) {
        var height = 0, width = 0;
        for (var i = 0; i < 6; i++) {
            width += i * this.width;
            ctx.moveTo(width + this.width * (i + 1), 0);
            ctx.lineTo(width + this.width * (i + 1), this.height);
            ctx.lineTo(width, this.height);
        }
    };
    slope.setYs = function (colSize, rowSize) {
        colSize++;
        rowSize++;
        slope.colSize = colSize;
        slope.rowSize = rowSize;
        switch (slope.type) {
            case TYPE.SLOPENE:
                if (colSize > 1) {
                    slope.leftY = slope.y + (slope.width / colSize) * slope.index;
                    slope.rightY = slope.y + ((slope.width / colSize) * slope.index) + (slope.width / colSize);
                } else {
                    slope.leftY = slope.y;
                    slope.rightY = slope.y + slope.height;
                }
                break;
            case TYPE.SLOPENW:
                slope.leftY = slope.y + (slope.width / colSize) * (colSize - slope.index);
                slope.rightY = slope.y + ((slope.width / colSize) * (colSize - slope.index)) - (slope.width / colSize);
                break;
            default:
                break;
        }
    }
    return slope;
}

fg.Crate = function (id, type, x, y, cx, cy, index) {
    var crate = Object.create(fg.protoEntity);
    crate = Object.assign(crate, fg.Active);
    crate.init(id, type, x, y, cx, cy, index);
    crate.width = fg.System.defaultSide / 2;
    crate.height = fg.System.defaultSide / 2;
    crate.cacheWidth = crate.width;
    crate.cacheHeight = crate.height;
    crate.drawTile = function (c, ctx) {
        c.width = fg.System.defaultSide / 2;
        c.height = fg.System.defaultSide / 2;

        ctx.fillStyle = "rgb(110,50,25)";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "rgb(205,153,69)";
        ctx.rect(1.5, 1.5, (c.width) - 3, (c.height) - 3);
        ctx.stroke();
        ctx.fillStyle = "rgb(150,79,15)";
        ctx.fillRect(3, 3, 7, 7);
        ctx.fillStyle = "rgb(125,66,13)";
        ctx.fillRect(3, 4, 7, 1);
        ctx.fillRect(3, 6, 7, 1);
        ctx.fillRect(3, 8, 7, 1);
        ctx.fillRect(c.width, 0, c.width, c.height);

        return c;
    };
    fg.Game.currentLevel.applySettingsToEntity(crate);
    return crate;
}

fg.Actor = function (id, type, x, y, cx, cy, index) {
    var actor = Object.create(fg.protoEntity);
    actor = Object.assign(actor, fg.Active);
    actor.init(id, type, x, y, cx, cy, index);
    actor.width = fg.System.defaultSide / 3;
    actor.height = fg.System.defaultSide - 4;
    actor.color = "red";
    actor.canJump = true;
    actor.active = false;
    actor.cacheWidth = actor.width;
    actor.cacheHeight = actor.height;
    //powerUps
    actor.glove = false;
    actor.wallJump = false;

    actor.wallSliding = false;
    actor.segments = [];
    actor.wait = 0;
    actor.respawn = 0;
    actor.lastCheckPoint = null;
    actor.drawTile = function (c, ctx) {
        c.width = this.width * 2;
        c.height = this.height;
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.fillRect(this.width, 0, this.width, this.height);
        return c;
    };
    actor.explode = function () {
        var divider = 4;
        for (var i = 0; i < this.width / divider; i++) {
            for (var k = 0; k < this.height / divider; k++) {
                var segment = fg.Entity(i + "." + k, "C", this.x + (i * divider), this.y + (k * divider), 0, 0, 0);
                segment.width = divider;
                segment.height = divider;
                segment.cacheWidth = segment.width;
                segment.cacheHeight = segment.height;
                segment.foreGround = true;
                segment.speedX = this.speedX;
                segment.speedY = this.speedY;
                segment.bounceness = 0.6;
                this.segments.push(segment);
            }
        }
        this.vanished = true;
        this.respawn = 240;
    },
        actor.drawSegments = function () {
            for (var i = 0, segment; segment = this.segments[i]; i++)
                fg.Game.foreGroundEntities.push(segment);
        };
    actor.checkDeath = function () {
        if (this.life == 0) {
            if (this.segments.length == 0) this.explode();
            this.drawSegments();
            fg.Camera.following = this.segments[0];
            if (this.respawn > 0)
                this.respawn--;
            else {
                this.segments = [];
                this.life = 100;
                this.vanished = undefined;
                fg.Camera.following = this;
                fg.Game.warp(this, { x: (parseInt(this.lastCheckPoint.id.split("-")[0]) - 1), y: parseInt(this.lastCheckPoint.id.split("-")[1]) });
            }
            return true;
        }
        return false;
    };
    actor.update = function () {
        if (actor.checkDeath()) return;
        this.soilFriction = 0.25;
        if (fg.Input.actions["jump"]) {
            if (this.canJump) {
                this.speedY = -(Math.abs(this.speedY) + this.accelY <= 0.2 ? Math.abs(this.speedY) + this.accelY : 0.2);
                if (this.wallSliding) this.speedX = fg.Input.actions["left"] ? 0.06 : -0.06;
            }
            if (Math.abs(this.speedY) >= 0.2) this.canJump = false;
        }
        this.active = false;
        if (fg.Input.actions["left"]) {
            this.active = true;
            this.soilFriction = 1;
            this.speedX = this.speedX - this.getAccelX() >= -this.maxSpeedX ? this.speedX - this.getAccelX() : -this.maxSpeedX;
        } else if (fg.Input.actions["right"]) {
            this.active = true;
            this.soilFriction = 1;
            this.speedX = this.speedX + this.getAccelX() <= this.maxSpeedX ? this.speedX + this.getAccelX() : this.maxSpeedX;
        }
        this.vectors = undefined;
        fg.Active.update.call(this);
        this.wallSliding = false;
        if (this.wallJump && !this.grounded && this.speedY > 0) {
            if ((fg.Input.actions["left"] || fg.Input.actions["right"]) && this.speedX == 0) {
                this.wallSliding = true;
                if (!fg.Input.actions["jump"]) this.canJump = true;
                this.speedY = 0.082;
            }
        }
    };
    return actor;
}

fg.Level = function (name) {
    var level = Object.create(fg.protoLevel);
    level.init(name);
    return level;
}

fg.Game =
    {
        levels: [],
        currentLevel: null,
        screenOffsetX: 0,//5818
        screenOffsetY: 0,//818,5200,72
        increaseX: 0,//0.06666=1
        increaseY: 0,
        currentEntities: [],
        foreGroundEntities: [],
        gravity: 0.012,//0.016,0.012
        actors: [],
        loaded: 0,
        paused: false,
        lastPauseState: undefined,
        started: false,
        fontAnimation: { fadeIn: false, blinkText: 0 },
        loadLevel: function (name) {
            this.levels.push(fg.Level(name));
            return this.levels[this.levels.length - 1];
        },
        start: function () {
            fg.System.init();
            this.currentLevel = this.loadLevel("levelOne");
            fg.Input.initKeyboard();
            fg.Input.bind(fg.Input.KEY.SPACE, "jump");
            fg.Input.bind(fg.Input.KEY.LEFT_ARROW, "left");
            fg.Input.bind(fg.Input.KEY.RIGHT_ARROW, "right");
            fg.Input.bind(fg.Input.KEY.A, "left");
            fg.Input.bind(fg.Input.KEY.D, "right");
            fg.Input.bind(fg.Input.KEY.ESC, "esc");
            fg.Input.bind(fg.Input.KEY.ENTER, "enter");
            if (fg.System.platform.mobile) {
                fg.Input.bindTouch(fg.$("#btnMoveLeft"), "left");
                fg.Input.bindTouch(fg.$("#btnMoveRight"), "right");
                fg.Input.bindTouch(fg.$("#btnJump"), "jump");
                fg.Input.bindTouch(fg.$("#main"), "esc");
            }
            this.run();
        },
        run: function () {
            if (fg.Game.currentLevel.loaded) {
                if (fg.Game.actors.length == 0) {
                    fg.Game.actors[0] = fg.Entity("A-A", TYPE.ACTOR, fg.System.defaultSide * 168, fg.System.defaultSide * 228, 0, 0, 0);//17,12|181,54|6,167|17,11|437,61|99,47|98,8|244,51|61,57
                    fg.Game.actors[0].bounceness = 0;
                    fg.Game.actors[0].searchDepth = 12;
                    fg.Camera.follow(fg.Game.actors[0]);

                    //fg.Game.actors[1] = fg.Entity("c-c", TYPE.CIRCLE, fg.System.defaultSide * 6, fg.System.defaultSide * 168, 0, 0, 0);//12,19|181,54|6,167|17,12                    
                    //fg.Camera.follow(fg.Game.actors[1]);
                }
                if (!fg.Game.started) {
                    if (Object.keys(fg.Input.actions).length > 0) {
                        fg.Input.actions = {};
                        fg.Game.started = true;
                    }
                    fg.Game.showTitle();
                } else fg.Game.update();
                fg.Timer.update();
            } else fg.Game.drawLoading(10, fg.System.canvas.height - 20, fg.System.canvas.width - 20, 20);

            requestAnimationFrame(fg.Game.run);
        },
        clearScreen: function () {
            fg.System.context.fillStyle = "rgb(55,55,72)";//"rgb(55,55,72)";// "deepSkyBlue";
            fg.System.context.fillRect(0, 0, fg.System.canvas.width, fg.System.canvas.height);
        },
        drawLoading: function (x, y, width, height, pos) {
            if (pos) {
                fg.System.context.fillStyle = "black";
                fg.System.context.fillRect(x, y, width, height);
                fg.System.context.fillStyle = "white";
                fg.System.context.fillRect(x + 1, y + 1, (pos * width) - 2, height - 2);
            } else {
                fg.System.context.font = "15px Arial";
                fg.System.context.fillStyle = "black";
                fg.System.context.fillText("Loading...", x, y);
            }
        },
        loadState: function(){
            //Load State
            if (localStorage.fallingSaveState != undefined) {
                var saveState = JSON.parse(localStorage.fallingSaveState);

                var posX = saveState.startPosition.x;
                var posY = saveState.startPosition.y;

                fg.Game.actors[0].x = (posY * fg.System.defaultSide) + fg.Game.actors[0].width / 2;
                fg.Game.actors[0].y = (posX * fg.System.defaultSide) + fg.Game.actors[0].height / 2;

                fg.Game.actors[0].glove = saveState.powerUps.glove;
                fg.Game.actors[0].light = saveState.powerUps.light;
                fg.Game.actors[0].wallJump = saveState.powerUps.wallJump;
                fg.Game.actors[0].superJump = saveState.powerUps.superJump;
                fg.Game.actors[0].velocity = saveState.powerUps.velocity;
            }
        },
        saveState: function (obj, actor) {
            var oldSaveState = localStorage.FallingSaveState ? JSON.parse(localStorage.FallingSaveState) : null;
            var saveStations = oldSaveState && oldSaveState.saveStations ? oldSaveState.saveStations : [];

            if (!saveStations.find(function (e) { return e.id == obj.id })) {
                saveStations.push({ id: obj.id, screen: obj.screen, date: new Date() });
            }

            var saveState = {
                startPosition: { x: obj.id.split('-')[0], y: obj.id.split('-')[1] },
                powerUps: {
                    glove: actor.glove,
                    light: actor.light,
                    wallJump: actor.wallJump,
                    superJump: actor.superJump,
                    velocity: actor.velocity
                },
                screen: { src: obj.screen.src },
                saveStations: saveStations
            };
            localStorage.fallingSaveState = JSON.stringify(saveState);
        },
        update: function () {
            if (fg.Input.actions["esc"] && fg.Input.actions["esc"] != this.lastPauseState) {
                this.paused = !this.paused
            }
            this.lastPauseState = fg.Input.actions["esc"];
            if (!this.paused) {
                this.clearScreen();
                this.foreGroundEntities = [];
                this.searchArea(((fg.System.canvas.width / 2) + fg.Game.screenOffsetX),
                    ((fg.System.canvas.height / 2) + fg.Game.screenOffsetY),
                    fg.System.searchDepth, Math.round(fg.System.searchDepth * (fg.System.canvas.height / fg.System.canvas.width)),
                    this.updateEntity);
                for (var index = 0, entity; entity = this.actors[index]; index++)
                    this.updateEntity(entity);
                for (var index = this.foreGroundEntities.length - 1, entity; entity = this.foreGroundEntities[index]; index--) {
                    if (entity.type != TYPE.SWITCH) entity.update();
                    entity.draw(true);
                }
                fg.Camera.update();
            } else {
                fg.System.context.fillStyle = "black";
                fg.System.context.fillRect((fg.System.canvas.width / 2) - 16, 170, 44, 12)
                this.drawFont("PAUSED", "", (fg.System.canvas.width / 2) - 12, 180);
            }
        },
        warp: function (entity, checkPoint) {
            var x = checkPoint ? checkPoint.x : 0;//warpx.value;
            var y = checkPoint ? checkPoint.y : 0;//warpy.value;
            if (x != "" && y != "") {
                entity.y = (x * fg.System.defaultSide) + entity.height / 2;
                entity.x = (y * fg.System.defaultSide) + entity.height / 2;
                fg.Camera.fixed = false;
            }
        },
        updateEntity: function (obj) {
            obj.update();
            if (obj.x > fg.Camera.right || obj.x + obj.width < fg.Camera.left || obj.y > fg.Camera.bottom || obj.y + obj.height < fg.Camera.top) return;
            obj.draw();
            if (obj.foreGround)
                fg.Game.foreGroundEntities.push(obj);
        },
        searchArea: function (startX, startY, depthX, depthY, loopCallBack, endLoopCallBack, caller) {
            this.currentEntities = [];
            var mainColumn = Math.round(startX / fg.System.defaultSide);
            var mainRow = Math.round(startY / fg.System.defaultSide);
            var startRowIndex = mainRow - depthY < 0 ? 0 : mainRow - depthY;
            var endRowIndex = mainRow + depthY > fg.Game.currentLevel.entities.length ? fg.Game.currentLevel.entities.length : mainRow + depthY;
            var startColIndex = mainColumn - depthX < 0 ? 0 : mainColumn - depthX;
            var endColIndex = mainColumn + depthX > fg.Game.currentLevel.entities[0].length ? fg.Game.currentLevel.entities[0].length : mainColumn + depthX;

            for (var i = (endRowIndex - 1); i >= startRowIndex; i--) {
                for (var k = startColIndex, obj; k < endColIndex; k++) {
                    var obj = fg.Game.currentLevel.entities[i][k];
                    if (!obj || obj.type == TYPE.DARKNESS)
                        continue;
                    if (loopCallBack)
                        (!caller ? loopCallBack : loopCallBack.bind(caller))(obj);
                    this.currentEntities.push(obj);
                    if (obj.target && obj.target.segments)
                        for (var index = 0, entity; entity = obj.target.segments[index]; index++)
                            this.currentEntities.push(entity);
                }
            }

            if (endLoopCallBack)
                (!caller ? endLoopCallBack : endLoopCallBack.bind(caller))();

            return this.currentEntities;
        },
        testOverlap: function (a, b) {
            if (a.id == b.id || b.vanished) return false;
            if (a.x > b.x + b.width || a.x + a.width < b.x) return false;
            if (a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.height + a.y > b.y) {
                return true;
            }
            return false;
        },
        showTitle: function () {
            var ctx = fg.System.context;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, fg.System.canvas.width, fg.System.canvas.height);
            ctx.closePath();
            ctx.beginPath();
            ctx.lineWidth = 2;
            var tittleXOffSet = 10;
            var tittleYOffSet = 60;
            ctx.strokeStyle = 'white';

            //F
            ctx.moveTo(20 + tittleXOffSet, 20 + tittleYOffSet);
            ctx.lineTo(53 + tittleXOffSet, 17 + tittleYOffSet);
            ctx.lineTo(54 + tittleXOffSet, 29 + tittleYOffSet);
            ctx.lineTo(32 + tittleXOffSet, 27 + tittleYOffSet);
            ctx.lineTo(34 + tittleXOffSet, 42 + tittleYOffSet);
            ctx.lineTo(48 + tittleXOffSet, 40 + tittleYOffSet);
            ctx.lineTo(50 + tittleXOffSet, 54 + tittleYOffSet);
            ctx.lineTo(31 + tittleXOffSet, 52 + tittleYOffSet);
            ctx.lineTo(33 + tittleXOffSet, 69 + tittleYOffSet);
            ctx.lineTo(19 + tittleXOffSet, 67 + tittleYOffSet);
            ctx.lineTo(20 + tittleXOffSet, 20 + tittleYOffSet);

            //a
            ctx.moveTo(20 + 60, 20 + 70);
            ctx.lineTo(52 + 60, 18 + 70);
            ctx.lineTo(48 + 60, 57 + 70);
            ctx.lineTo(22 + 60, 60 + 70);
            ctx.lineTo(18 + 60, 43 + 70);
            ctx.lineTo(42 + 60, 39 + 70);
            ctx.lineTo(37 + 60, 29 + 70);
            ctx.lineTo(19 + 60, 32 + 70);
            ctx.lineTo(20 + 60, 20 + 70);

            //l
            ctx.moveTo(20 + 110, 20 + 70);
            ctx.lineTo(32 + 110, 18 + 70);
            ctx.lineTo(31 + 110, 57 + 70);
            ctx.lineTo(18 + 110, 62 + 70);
            ctx.lineTo(20 + 110, 20 + 70);

            //l                     
            ctx.moveTo(20 + 140, 20 + 70);
            ctx.lineTo(32 + 140, 18 + 70);
            ctx.lineTo(31 + 140, 57 + 70);
            ctx.lineTo(18 + 140, 62 + 70);
            ctx.lineTo(20 + 140, 20 + 70);

            //i                     
            ctx.moveTo(20 + 165, 20 + 90);
            ctx.lineTo(32 + 165, 18 + 90);
            ctx.lineTo(31 + 165, 42 + 90);
            ctx.lineTo(18 + 165, 44 + 90);
            ctx.lineTo(20 + 165, 20 + 90);

            //n
            ctx.moveTo(20 + 190, 20 + 82);
            ctx.lineTo(49 + 190, 52 + 82);
            ctx.lineTo(41 + 190, 49 + 82);
            ctx.lineTo(28 + 190, 42 + 82);
            ctx.lineTo(31 + 190, 51 + 82);
            ctx.lineTo(19 + 190, 49 + 82);
            ctx.lineTo(20 + 190, 20 + 82);

            //g
            ctx.moveTo(20 + 230, 20 + 90);
            ctx.lineTo(51 + 230, 19 + 90);
            ctx.lineTo(48 + 230, 59 + 90);
            ctx.lineTo(18 + 230, 61 + 90);
            ctx.lineTo(21 + 230, 52 + 90);
            ctx.lineTo(39 + 230, 50 + 90);
            ctx.lineTo(41 + 230, 41 + 90);
            ctx.lineTo(19 + 230, 38 + 90);
            ctx.lineTo(20 + 230, 20 + 90);

            ctx.stroke();

            this.drawFont("Press space...","",120,180);
            /*if (tracks[0].paused) {
                tracks[0].play();
            }*/
        },
        drawFont:function(text,color,x,y){
            if (fg.Game.fontAnimation.fadeIn)
                fg.Game.fontAnimation.blinkText += 1;
            else
                fg.Game.fontAnimation.blinkText -= 1;

            if (fg.Game.fontAnimation.blinkText >= 100) fg.Game.fontAnimation.fadeIn = false;

            if (fg.Game.fontAnimation.blinkText <= 0) fg.Game.fontAnimation.fadeIn = true;

            fg.System.context.font = "10px Arial";
            fg.System.context.fillStyle = "rgba(255,255,255," + fg.Game.fontAnimation.blinkText / 100 + ")";
            fg.System.context.fillText(text, x, y);
        },
        drawBackGround: function () {
            var bgSize = 4;
            var bgRow = Math.floor(((c.height / 2) + moveDown) * .5 / (defaultHeight * 2));
            var bgColumn = Math.floor(((c.width / 2) + scroller) * .5 / (defaultWidth * 2));

            var bgDrawDepthX = disableBG ? -1 : 4;//6
            var bgDrawDepthY = disableBG ? -1 : 3;//6

            var startBgRowIndex = /*bgRow - bgDrawDepthY < 0 ? 0 :*/ bgRow - bgDrawDepthY;
            var endBgRowIndex = bgRow + bgDrawDepthY;

            var startBgColIndex = /*bgColumn - bgDrawDepthX < 0 ? 0 :*/ bgColumn - bgDrawDepthX;
            var endBgColIndex = bgColumn + bgDrawDepthX;

            for (var i = startBgRowIndex; i <= endBgRowIndex; i++) {
                for (var k = startBgColIndex, obj; k <= endBgColIndex; k++) {
                    var bgRowIndex = (i > 0 ? i : bgSize + i) % bgSize;
                    var bgColIndex = (k > 0 ? k : bgSize + k) % bgSize;
                    obj = BackGround[bgRowIndex][bgColIndex];
                    if (!obj)
                        continue;

                    obj.bgOffSetX = ((Math.floor(k / bgSize) * (defaultWidth * 2) * bgSize)) + (obj.width * 2);
                    obj.bgOffSetY = ((Math.floor(i / bgSize) * (defaultHeight * 2) * bgSize)) + (obj.height);

                    if (obj.isVisible())
                        obj.Draw();
                }
            }
        }
    }

fg.Render = {
    marioCache: {},
    cached: {},
    offScreenRender: function () {
        if (!this.hc) {
            this.hc = fg.$new("canvas");
            this.hc.width = fg.System.defaultSide
            this.hc.width = fg.System.defaultSide
            return this.hc;
        }
        else
            return this.hc;
    },
    drawOffScreen: function (data, cacheX, cacheY, width, height, mapX, mapY) {
        this.offScreenRender().getContext('2d').drawImage(data, cacheX, cacheY, width, height, mapX, mapY, width, height);
    },
    drawToCache: function (data, x, y, type) {
        this.cached[type].getContext('2d').drawImage(data, x, y);
    },
    preRenderCanvas: function () { return fg.$new("canvas"); },
    draw: function (data, cacheX, cacheY, width, height, mapX, mapY) {
        fg.System.context.drawImage(data, cacheX, cacheY, width, height,
            Math.floor(mapX - fg.Game.screenOffsetX), Math.floor(mapY - fg.Game.screenOffsetY), width, height);
    },
    cache: function (type, data) {
        this.cached[type] = data;
        return this.cached[type];
    }
}

fg.Input = {
    actions: {},
    bindings: {},
    KEY: { 'MOUSE1': -1, 'MOUSE2': -3, 'MWHEEL_UP': -4, 'MWHEEL_DOWN': -5, 'BACKSPACE': 8, 'TAB': 9, 'ENTER': 13, 'PAUSE': 19, 'CAPS': 20, 'ESC': 27, 'SPACE': 32, 'PAGE_UP': 33, 'PAGE_DOWN': 34, 'END': 35, 'HOME': 36, 'LEFT_ARROW': 37, 'UP_ARROW': 38, 'RIGHT_ARROW': 39, 'DOWN_ARROW': 40, 'INSERT': 45, 'DELETE': 46, '_0': 48, '_1': 49, '_2': 50, '_3': 51, '_4': 52, '_5': 53, '_6': 54, '_7': 55, '_8': 56, '_9': 57, 'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71, 'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78, 'O': 79, 'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84, 'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90, 'NUMPAD_0': 96, 'NUMPAD_1': 97, 'NUMPAD_2': 98, 'NUMPAD_3': 99, 'NUMPAD_4': 100, 'NUMPAD_5': 101, 'NUMPAD_6': 102, 'NUMPAD_7': 103, 'NUMPAD_8': 104, 'NUMPAD_9': 105, 'MULTIPLY': 106, 'ADD': 107, 'SUBSTRACT': 109, 'DECIMAL': 110, 'DIVIDE': 111, 'F1': 112, 'F2': 113, 'F3': 114, 'F4': 115, 'F5': 116, 'F6': 117, 'F7': 118, 'F8': 119, 'F9': 120, 'F10': 121, 'F11': 122, 'F12': 123, 'SHIFT': 16, 'CTRL': 17, 'ALT': 18, 'PLUS': 187, 'COMMA': 188, 'MINUS': 189, 'PERIOD': 190 },
    keydown: function (event) {
        if (fg.Input.bindings[event.keyCode]) {
            fg.Input.actions[fg.Input.bindings[event.keyCode]] = true;
        }
    },
    keyup: function (event) {
        if (fg.Input.bindings[event.keyCode]) {
            delete fg.Input.actions[fg.Input.bindings[event.keyCode]];
        }
    },
    initKeyboard: function () {
        window.addEventListener('keydown', this.keydown, false);
        window.addEventListener('keyup', this.keyup, false);
    },
    bind: function (key, action) {
        this.bindings[key] = action;
    },
    bindTouch: function (element, action) {
        element.addEventListener('touchstart', function (e) { fg.Input.touchStart(e, action); }, false);
        element.addEventListener('touchend', function (e) { fg.Input.touchEnd(e, action); }, false);
    },
    touchStart: function (e, action) {
        fg.Input.actions[action] = true;
        e.stopPropagation();
        e.preventDefault();
    },
    touchEnd: function (e, action) {
        delete fg.Input.actions[action]
        e.stopPropagation();
        e.preventDefault();
    }
}

fg.Timer = {
    showFPS: true,
    currentTime: null,
    lastTime: null,
    deltaTime: null,
    totalTime: 0,
    ticks: 0,
    fps: 0,
    update: function () {
        var d = new Date();
        this.currentTime = d.getTime();
        if (!this.lastTime)
            this.lastTime = this.currentTime - 15;
        if (this.showFPS && !fg.Game.paused) {
            this.totalTime += Math.round(1000 / ((this.currentTime - this.lastTime)));
            if (this.ticks % 50 == 0) {
                this.fps = this.totalTime / 50;
                this.totalTime = 0;
            }

            fg.System.context.font = "10px Arial";
            fg.System.context.fillStyle = "white";
            fg.System.context.fillText(this.fps, 10, 10);
        }
        this.deltaTime = 16;//Math.floor((Math.max(this.currentTime - this.lastTime, 15) <= 30 ? this.currentTime - this.lastTime : 30) / 2) * 2;//16
        this.lastTime = this.currentTime;
        this.ticks++;
    }
}

var TYPE = {
    WALL: "X",
    BOUNCER: "B",
    GROWER: "G",
    SWITCH: "S",
    PILLAR: "P",
    CRATE: "C",
    BOX: "b",
    PLATFORM: "p",
    TUNNEL: "T",
    CIRCLE: "c",
    GLOVE: "g",
    SLOPENE: "╗",
    SLOPESE: "╝",
    SLOPESW: "╚",
    SLOPENW: "╔",
    DARKNESS: "D",
    LIGHT: "l",
    TURTLE: "t",
    WALLJUMP: "j",
    MARIO: "M",
    SAVE: "s",
    CHECKPOINT: "h",
    VELOCITY: "v",
    SUPERJUMP: "j",
    SENTRY: "e",
    ACTOR: "A"
}
