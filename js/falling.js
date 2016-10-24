"use strict";
(function (window) {
    window.fg =
        {
            $: function (selector) {
                return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
            },
            $new: function (name) { return document.createElement(name); },
            loadScript: function (root, name, callBack, callBackParams) {
                let path = root + name.replace(/\./g, '/') + '.js';
                let script = fg.$new('script');
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

                let output = Object(target);
                for (let index = 1; index < arguments.length; index++) {
                    let source = arguments[index];
                    if (source !== undefined && source !== null) {
                        for (let nextKey in source) {
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
}
)(window);


fg.Camera = {
    following: null,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    init: function () { },
    follow: function (obj) {
        this.following = obj;
    },
    moveTo: function (position) { },
    update: function () {
        if (!this.following)
            return;
        fg.Game.screenOffsetX = Math.min(Math.max(this.following.x + (this.following.width / 2) - (fg.System.canvas.width / 2), 0), fg.Game.currentLevel.width - fg.System.canvas.width);
        fg.Game.screenOffsetY = Math.min(Math.max(this.following.y + (this.following.height / 2) - (fg.System.canvas.height / 2), 0), fg.Game.currentLevel.height - fg.System.canvas.height);
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
    loadSettings: function () {
        this.levelSwiches = window[this.name].levelSwiches;
        this.movingPlatforms = window[this.name].movingPlatforms;
    },
    createEntities: function () {
        let rows = window[this.name].tiles.split('\n');
        for (let i = 0, row; row = rows[i]; i++) {
            if (!this.entities[i])
                this.entities[i] = [];
            for (let k = 0, col; col = row[k]; k++) {
                if (!col.match(/[ #\d]/g)) {
                    let cx = 0, cy = 0, idx = 0;
                    if ((!row[k + 1] || !row[k + 1].match(/[\d]/g)) && (!rows[i + 1] || !rows[i + 1][k].match(/[\d]/g))) {
                        this.entities[i][k] = fg.Entity(i + "-" + k, col, fg.System.defaultSide * k, fg.System.defaultSide * i, 0, 0, 0);
                        if (this.entities[i][k].setYs)
                            this.entities[i][k].setYs(null, null);
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
        let settings = undefined;
        switch (entity.type) {
            case TYPE.PLATFORM:
                settings = this.movingPlatforms.find(function (e) { return e.id == entity.id });
                break;
            case TYPE.SWITCH:
                settings = this.levelSwiches.find(function (e) { return e.id == entity.id });
                break;
            default:
                break;
        }
        if (settings) Object.assign(entity, settings.settings);
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
    },
    init: function (name) {
        this.name = name;
        this.load();
    },
    addEntityColumn: function (row, col, i, k, cx, cy, idx) {//row-column
        for (let index = 0; index <= row[k + 1]; index++) {
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
        for (let index = 0; index <= rows[i + 1][k]; index++) {
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
        let computedPos = null;
        for (let kIndex = 0; kIndex <= row[k + 1]; kIndex++) {
            for (let iIndex = 0; iIndex <= rows[i + 1][k]; iIndex++) {
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
        let cx = fg.System.defaultSide * xMultiplyer;
        let cy = fg.System.defaultSide * yMultiplyer;
        return { idx: idx, cx: cx, cy: cy };
    }
}

fg.protoEntity = {
    x: 0,
    y: 0,
    index: 0,
    init: function (id, type, x, y, cx, cy, index) {
        this.type = type;
        this.id = id;
        this.width = fg.System.defaultSide;
        this.height = fg.System.defaultSide;
        this.color = "black";
        this.x = x;
        this.y = y;
        this.cacheX = cx;
        this.cacheY = cy;
        this.index = index;
        this.collidable = this.type != TYPE.TUNNEL && this.type != TYPE.DARKNESS;
        this.segments = [];
        return this;
    },
    draw: function () {
        if (!fg.Render.cached[this.type]) {
            let c = fg.Render.preRenderCanvas();
            let ctx = c.getContext("2d");
            c = this.drawTile(c, ctx);
            if (c)
                fg.Render.draw(fg.Render.cache(this.type, c), this.x, this.y, this.cacheX, this.cacheY, this.width, this.height);
        }
        else {
            fg.Render.draw(fg.Render.cached[this.type], this.x, this.y, this.cacheX, this.cacheY, this.width, this.height);
        }
    },
    drawTile: function () { },
    update: function () { }
}

fg.Active =
    {
        active: true,
        speedX: 0,//-0.49
        speedY: 0,
        grounded: false,
        maxSpeedX: .14,//0.12
        maxSpeedY: .4,
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
        update: function () {
            this.addGravity();
            this.entitiesToTest = fg.Game.searchArea(this.x, this.y, this.searchDepth, this.searchDepth);
            this.lastPosition = { x: this.x, y: this.y, grounded: this.grounded };
            this.speedX = this.getSpeedX();
            for (let index = 0, entity; entity = fg.Game.actors[index]; index++)
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
            for (let i = this.entitiesToTest.length - 1, obj; obj = this.entitiesToTest[i]; i--) {
                if (fg.Game.testOverlap(this.nextPosition, obj)) {
                    this.entitiesToResolveX.push(obj);
                    this.entitiesToResolveY.push(obj);
                    if (this.entitiesToResolveX.length >= 3)
                        break;
                }
            }
            if (this.entitiesToResolveX.length > 0) {
                this.resolveCollisions(this.entitiesToResolveX, this.entitiesToResolveY);
            } else {
                this.x = this.nextPosition.x;
                this.y = this.nextPosition.y;
                if (this.canJump && this.y - this.lastPosition.y > 1)
                    this.canJump = false;
            }
        },
        resolveCollisions: function (entitiesToResolveX, entitiesToResolveY) {
            if (entitiesToResolveX.length > 1) entitiesToResolveX.sort(function (a, b) { return a.slope; });
            if (entitiesToResolveY.length > 1) entitiesToResolveY.sort(function (a, b) { return a.slope; });
            let countx = 0, county = 0;
            this.x += (this.speedX + this.addedSpeedX) * fg.Timer.deltaTime;
            while (entitiesToResolveX.length > 0) {
                let obj = entitiesToResolveX[entitiesToResolveX.length - 1];
                this.resolveForX(entitiesToResolveX, obj);
                county++;
                if (county > 3) break;
            }
            this.y += this.speedY * fg.Timer.deltaTime;
            while (entitiesToResolveY.length > 0) {
                let obj = entitiesToResolveY[entitiesToResolveY.length - 1];
                this.resolveForY(entitiesToResolveY, obj);
                countx++;
                if (countx > 3) break;
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
            let intersection = this.getIntersection(obj);
            if ((intersection.height >= intersection.width && intersection.height > 1)) {
                if (this.x < obj.x)
                    this.x = obj.x - this.width;
                else
                    this.x = obj.x + obj.width;
                this.speedX = this.speedX * -1;
                if (obj.active)
                    obj.speedX -= this.speedX * Math.max(this.bounceness, (obj.bounceness || 0));
                this.speedX = Math.abs(this.speedX) * Math.max(this.bounceness, (obj.bounceness || 0)) >= 0.001 ? this.speedX * Math.max(this.bounceness, (obj.bounceness || 0)) : 0;
            } else {
                if (Math.round((this.y + intersection.height) * 100) / 100 >= Math.round((obj.y + obj.height) * 100) / 100)
                    this.y = obj.y + obj.height;
                else
                    this.y = obj.y - this.height;
                if (Math.abs(this.y - this.lastPosition.y) >= obj.height)
                    this.y = this.lastPosition.y;
            }
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
            let t = (Math.round(this.x + (this.width / 2)) - obj.x) / (fg.System.defaultSide / (obj.rowSize || 1));
            let hitY = (1 - t) * obj.leftY + t * obj.rightY;
            if (this.y + this.height >= hitY) {
                if (!fg.Input.actions["jump"])
                    this.canJump = true;
                this.speedY = 0;
                this.y = hitY - this.height;
                this.grounded = true;
            }
        },
        resolveNonOneWayYCollision: function (obj) {
            if (obj.interactive) obj.interact(this);
            if (this.y <= obj.y)
                this.y = obj.y - this.height;
            else
                this.y = obj.y + obj.height;
            this.speedY = this.speedY * -1;
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
        },
        computeAddedSpeedX: function (newAddedValue) {
            if (newAddedValue == 0) return newAddedValue;
            let multiplyer = Math.min(Math.abs(this.addedSpeedX + this.speedX), Math.abs(newAddedValue)) / Math.max(Math.abs(this.addedSpeedX + this.speedX), Math.abs(newAddedValue));
            if (multiplyer == 0) multiplyer = 0.001;
            if (multiplyer < 0.9 && Math.abs(newAddedValue) > 0.06) return newAddedValue * multiplyer;
            return newAddedValue;
        },
        nonSlopeYcollision: function (obj) {
            if (this.speedY >= 0) {
                if (!fg.Input.actions["jump"])
                    this.canJump = true;
                this.grounded = true;
            }
            this.addedSpeedX = this.computeAddedSpeedX((obj.addedSpeedX || obj.speedX) || 0);
            let intersection = this.getIntersection(obj);
            if (intersection.height <= intersection.width) {
                if (!obj.oneWay && !this.grounded) {
                    this.resolveNonOneWayYCollision(obj);
                } else {
                    if (obj.interactive) obj.interact(this);
                    if (this.lastPosition.y + this.height <= obj.y && this.y + this.height > obj.y) {
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
            let intersection = { x: Math.max(this.x, obj.x), y: Math.max(this.y, obj.y) };
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
            return fg.Circle(id, type, x, y, cx, cy, index);
        default:
            return Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index);
    }
}

fg.Circle = function (id, type, x, y, cx, cy, index) {
    let circle = Object.create(fg.protoEntity);
    circle = Object.assign(circle, fg.Active);
    circle.init(id, type, x, y, cx, cy, index);
    circle.soilFriction = 0.999;
    circle.speedX = -0.4;//1.4
    circle.bounceness = 0.7;
    circle.width = fg.System.defaultSide / 2;
    circle.height = fg.System.defaultSide / 2;
    circle.drawTile = function (c, ctx) {
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

fg.Wall = function (id, type, x, y, cx, cy, index) {
    let wall = Object.create(fg.protoEntity);
    wall.init(id, type, x, y, cx, cy, index);
    fg.Game.currentLevel.applySettingsToEntity(wall);
    if (type == TYPE.GROWER)
        wall = Object.assign(wall, fg.Interactive, fg.Grower);
    if (wall.type == TYPE.PLATFORM)
        wall = Object.assign(wall, fg.Interactive, fg.Platform, wall.moving ? fg.MovingPlatform : null);
    wall.slope = false;
    wall.foreGround = type == TYPE.TUNNEL;
    if (type == TYPE.BOUNCER) {
        wall.color = "red";
        wall.bounceness = 1.4;
    }
    wall.drawTile = function (c, ctx) {
        c.width = this.width * 4;
        c.height = this.height * (this.type == TYPE.PLATFORM ? 1 : 4);
        for (let i = 0; i < (this.type == TYPE.PLATFORM ? 2 : 4); i++) {

            let startX = (i == 1 || i == 3 ? this.width : 0);
            let startY = (i == 2 || i == 3 ? this.width : 0);
            let widthMultiplyer = (i == 1 || i == 3 ? 3 : 1);
            let heightMultiplyer = (i == 2 || i == 3 ? 3 : 1);

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
    }
}

fg.Switch = {
    on: false,
    target: undefined,
    init: function () { },
    update: function () { },
    drawTile: function (c, ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 5, this.width, this.height - 5);
        return c;
    }
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
            for (let i = 0, segment; segment = this.segments[i]; i++)
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
            for (let i = 0, segment; segment = this.segments[i]; i++) {
                let sgmt = fg.Game.currentLevel.entities[segment.l][segment.c];
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

fg.Slope = function (id, type, x, y, cx, cy, index) {
    let slope = Object.create(fg.protoEntity);
    slope.init(id, type, x, y, cx, cy, index);
    slope.slope = true;
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
        let height = 0, width = 0;
        for (let i = 0; i < 6; i++) {
            width += i * this.width;
            ctx.moveTo(width, 0);
            ctx.lineTo(width, this.height);
            ctx.lineTo(width + this.width * (i + 1), this.height);
        }
    };
    slope.drawNW = function (ctx) {
        let height = 0, width = 0;
        for (let i = 0; i < 6; i++) {
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
    let crate = Object.create(fg.protoEntity);
    crate = Object.assign(crate, fg.Active);
    crate.init(id, type, x, y, cx, cy, index);
    crate.width = fg.System.defaultSide / 2;
    crate.height = fg.System.defaultSide / 2;
    crate.drawTile = function (c, ctx) {
        c.width = this.width * 2;
        c.height = this.height;

        ctx.fillStyle = "rgb(110,50,25)";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "rgb(205,153,69)";
        ctx.rect(1.5, 1.5, (this.width) - 3, (this.height) - 3);
        ctx.stroke();
        ctx.fillStyle = "rgb(150,79,15)";
        ctx.fillRect(3, 3, 7, 7);
        ctx.fillStyle = "rgb(125,66,13)";
        ctx.fillRect(3, 4, 7, 1);
        ctx.fillRect(3, 6, 7, 1);
        ctx.fillRect(3, 8, 7, 1);
        ctx.fillRect(this.width, 0, this.width, this.height);

        return c;
    };

    return crate;
}

fg.Actor = function (id, type, x, y, cx, cy, index) {
    let actor = Object.create(fg.protoEntity);
    actor = Object.assign(actor, fg.Active);
    actor.init(id, type, x, y, cx, cy, index);
    actor.width = fg.System.defaultSide / 3;
    actor.color = "red";
    actor.canJump = true;
    actor.active = false;
    actor.drawTile = function (c, ctx) {
        c.width = this.width * 2;
        c.height = this.height;
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.fillRect(this.width, 0, this.width, this.height);
        return c;
    };
    actor.update = function () {
        this.soilFriction = 0.25;
        if (fg.Input.actions["jump"]) {
            if (this.canJump)
                this.speedY = -(Math.abs(this.speedY) + this.accelY <= 0.2 ? Math.abs(this.speedY) + this.accelY : 0.2);
            /*else
                this.speedY = this.speedY * 0.6;*/

            if (Math.abs(this.speedY) >= 0.2)
                this.canJump = false;
        }
        this.active = false;
        if (fg.Input.actions["left"]) {
            this.active = true;
            this.soilFriction = 1;
            this.speedX = this.speedX - this.getAccelX() >= -this.maxSpeedX ? this.speedX - this.getAccelX() : -this.maxSpeedX;
        }
        else if (fg.Input.actions["right"]) {
            this.active = true;
            this.soilFriction = 1;
            this.speedX = this.speedX + this.getAccelX() <= this.maxSpeedX ? this.speedX + this.getAccelX() : this.maxSpeedX;
        }
        fg.Active.update.call(this);
    };
    return actor;
}

fg.Level = function (name) {
    let level = Object.create(fg.protoLevel);
    level.init(name);
    return level;
}

fg.System =
    {
        context: null,
        defaultSide: 24,//24
        searchDepth: 16,
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
            let auxCanvas = document.createElement('canvas');
            auxCanvas.width = 64;
            auxCanvas.height = 64;
            let auxCanvasCtx = auxCanvas.getContext('2d');

            let imgLeft = document.getElementById("btnMoveLeft");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.moveTo(48, 16);
            auxCanvasCtx.lineTo(48, 48);
            auxCanvasCtx.lineTo(16, 32);
            auxCanvasCtx.fill();
            imgLeft.src = auxCanvas.toDataURL("image/png");

            let imgRight = document.getElementById("btnMoveRight");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.moveTo(16, 16);
            auxCanvasCtx.lineTo(16, 48);
            auxCanvasCtx.lineTo(48, 32);
            auxCanvasCtx.fill();
            imgRight.src = auxCanvas.toDataURL("image/png");

            let imgJump = document.getElementById("btnJump");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.arc(auxCanvas.width / 2, auxCanvas.height / 2, 16, 0, 2 * Math.PI);
            auxCanvasCtx.fill();
            imgJump.src = auxCanvas.toDataURL("image/png");
        }
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
            if (fg.System.platform.mobile) {
                fg.Input.bindTouch(fg.$("#btnMoveLeft"), "left");
                fg.Input.bindTouch(fg.$("#btnMoveRight"), "right");
                fg.Input.bindTouch(fg.$("#btnJump"), "jump");
            }
            this.run();
        },
        run: function () {
            if (fg.Game.currentLevel.loaded) {
                if (fg.Game.actors.length == 0) {
                    fg.Game.actors[0] = fg.Entity("A-A", TYPE.ACTOR, fg.System.defaultSide * 99, fg.System.defaultSide * 5, 0, 0, 0);//17,12|181,54|6,167|17,11|437,61|99,47|98,8
                    fg.Game.actors[0].bounceness = 0;
                    fg.Game.actors[0].searchDepth = 12;
                    fg.Camera.follow(fg.Game.actors[0]);

                    //fg.Game.actors[1] = fg.Entity("c-c", TYPE.CIRCLE, fg.System.defaultSide * 6, fg.System.defaultSide * 168, 0, 0, 0);//12,19|181,54|6,167|17,12                    
                    //fg.Camera.follow(fg.Game.actors[1]);
                }
                fg.Game.update();
            }

            requestAnimationFrame(fg.Game.run);
        },
        clearScreen: function () {
            fg.System.context.fillStyle = "rgb(55,55,72)";//"rgb(55,55,72)";// "deepSkyBlue";
            fg.System.context.fillRect(0, 0, fg.System.canvas.width, fg.System.canvas.height);
        },
        drawProgress: function (x, y, width, height, pos) {
            fg.System.context.fillStyle = "black";
            fg.System.context.fillRect(x, y, width, height);
            fg.System.context.fillStyle = "white";
            fg.System.context.fillRect(x + 1, y + 1, (pos * width) - 2, height - 2);
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
                for (let index = 0, entity; entity = this.actors[index]; index++)
                    this.updateEntity(entity);
                for (let index = 0, entity; entity = this.foreGroundEntities[index]; index++)
                    entity.draw();
                fg.Timer.update();
                fg.Camera.update();
            } else {

            }
        },
        updateEntity: function (obj) {
            obj.update();
            if (obj.x > fg.Camera.right || obj.x + obj.width < fg.Camera.left || obj.y > fg.Camera.bottom || obj.y + obj.height < fg.Camera.top) return;
            if (!obj.foreGround)
                obj.draw();
            else
                fg.Game.foreGroundEntities.push(obj);
        },
        searchArea: function (startX, startY, depthX, depthY, loopCallBack, endLoopCallBack, caller) {
            this.currentEntities = [];
            const mainColumn = Math.floor(startX / fg.System.defaultSide);
            const mainRow = Math.floor(startY / fg.System.defaultSide);
            const startRowIndex = mainRow - depthY < 0 ? 0 : mainRow - depthY;
            const endRowIndex = mainRow + depthY > fg.Game.currentLevel.entities.length ? fg.Game.currentLevel.entities.length : mainRow + depthY;
            const startColIndex = mainColumn - depthX < 0 ? 0 : mainColumn - depthX;
            const endColIndex = mainColumn + depthX > fg.Game.currentLevel.entities[0].length ? fg.Game.currentLevel.entities[0].length : mainColumn + depthX;

            for (let i = (endRowIndex - 1); i >= startRowIndex; i--) {
                for (let k = startColIndex, obj; k < endColIndex; k++) {
                    let obj = fg.Game.currentLevel.entities[i][k];
                    if (!obj)
                        continue;
                    if (loopCallBack)
                        (!caller ? loopCallBack : loopCallBack.bind(caller))(obj);
                    this.currentEntities.push(obj);
                }
            }

            if (endLoopCallBack)
                (!caller ? endLoopCallBack : endLoopCallBack.bind(caller))();

            return this.currentEntities;
        },
        testOverlap: function (a, b) {
            if (a.id == b.id || !b.collidable) return false;
            if (a.x > b.x + b.width || a.x + a.width < b.x) return false;
            if (a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.height + a.y > b.y) {
                return true;
            }
            return false;
        },
        drawBackGround: function () {
            let bgSize = 4;
            let bgRow = Math.floor(((c.height / 2) + moveDown) * .5 / (defaultHeight * 2));
            let bgColumn = Math.floor(((c.width / 2) + scroller) * .5 / (defaultWidth * 2));

            let bgDrawDepthX = disableBG ? -1 : 4;//6
            let bgDrawDepthY = disableBG ? -1 : 3;//6

            let startBgRowIndex = /*bgRow - bgDrawDepthY < 0 ? 0 :*/ bgRow - bgDrawDepthY;
            let endBgRowIndex = bgRow + bgDrawDepthY;

            let startBgColIndex = /*bgColumn - bgDrawDepthX < 0 ? 0 :*/ bgColumn - bgDrawDepthX;
            let endBgColIndex = bgColumn + bgDrawDepthX;

            for (let i = startBgRowIndex; i <= endBgRowIndex; i++) {
                for (let k = startBgColIndex, obj; k <= endBgColIndex; k++) {
                    let bgRowIndex = (i > 0 ? i : bgSize + i) % bgSize;
                    let bgColIndex = (k > 0 ? k : bgSize + k) % bgSize;
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
    cached: {},
    preRenderCanvas: function () { return fg.$new("canvas"); },
    draw: function (data, mapX, mapY, cacheX, cacheY, width, height) {
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
        let d = new Date();
        this.currentTime = d.getTime();
        if (!this.lastTime)
            this.lastTime = this.currentTime - 15;
        if (this.showFPS) {
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

const TYPE = {
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
