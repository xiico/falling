var perfTest = {tiles:
"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n"+
"X                      X╝      XX                                X\n"+
"X   CX4   XXX                  ╚X                       ╔X       X\n"+
"XCC CXXXXXX       X╗               X╗   X╗1        p    XX       X\n"+
"XCXXXXXXXXX C    XXX╗1       X     2 ╗  XXX╗1    ╔X╗             X\n"+
"X           C  XXXXXXX╗2     X        ╗ XXXXX╗1 ╔XXX╗            X\n"+
"XXX    X4   XXXXXXXXXXXXX╗2        X2 XXXXXXXXXXXXXXX     X  X   X\n"+
"3XXX    CC        XXXXXXXXXX╗2                                   X\n"+
" XXXX   CC        XXXXXXXXXXXXXXSXXXXXXXXXXXXXXXXXXXXXSSSSXXXXX  X\n"+
"      XXCC                                                       X\n"+
"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    movingPlatforms: [{ id: "3-51", features: { moving: true }, settings: { movingOnX: true } }],
    levelSwiches: [//{ id: "8-54", features: { moveTarget: true }, settings: { targetId: "6-58", defaulTimer: 120, direction: "U" } },
                   { id: "8-55", features: { moveTarget: true }, settings: { targetId: "6-58", timed: true, defaulTimer: 120, direction: "D" } },
                   { id: "8-56", features: { moveTarget: true }, settings: { targetId: "6-58", timed: true, defaulTimer: 120, direction: "L" } },
                   //{ id: "8-57", features: { moveTarget: true }, settings: { targetId: "6-58", defaulTimer: 120, direction: "R" } }
                   { id: "8-32", features: { moveTarget: true }, settings: { targetId: "8-33", timed: true, defaulTimer: 120, direction: "U", distance: 1 } },
                   ],
    customProperties: [{ id: "4-12", settings: { searchDepth: 8 } }],
backGround:
"X X \n" +
" X X\n" +
"X X \n" +
" X X"}