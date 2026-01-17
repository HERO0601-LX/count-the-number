const GAME_CONFIG = {
  "modes": {
    "easy": {
      "name": "简单模式",
      "catRange": [4, 6],
      "distractionStartLevel": 1,
      "levels": 10,
      "jumpLevels": [3, 7] // 有跳动干扰的关卡
    },
    "standard": {
      "name": "标准模式",
      "catRange": [4, 15],
      "distractionStartLevel": 1,
      "levels": 10,
      "jumpLevels": [4, 8] // 有跳动干扰的关卡
    },
    "hard": {
      "name": "地狱模式",
      "catRange": [4, 25],
      "distractionStartLevel": 1,
      "levels": 10,
      "jumpLevels": [5, 9] // 有跳动干扰的关卡
    }
  },
  "levelConfig": [
    { "level": 1, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 2, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 3, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 4, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 5, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 6, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 7, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 8, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 9, "flashDuration": 2000, "distractionCount": 0 },
    { "level": 10, "flashDuration": 2000, "distractionCount": 0 }
  ],
  "distractions": [
    { "type": "apple", "color": "#ff0000", "shape": "circle" },
    { "type": "banana", "color": "#ffe135", "shape": "crescent" },
    { "type": "fish", "color": "#0000ff", "shape": "fish" }
  ]
};
