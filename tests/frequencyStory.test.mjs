import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_DATA, OTHER_CLASS_DATA, storyRange, placeStoryCard, checkStoryReport } from '../src/routes/dev/frequencyStory.ts';

test('story ranges include lower bounds and exclude upper bounds', () => {
  for (const [value,range] of [[10,0],[19,0],[20,1],[29,1],[30,2],[39,2]]) assert.equal(storyRange(value),range);
  for (const value of [9,40,NaN,Infinity]) assert.equal(storyRange(value),null);
});
test('classification preserves duplicate observations and rejects invalid or repeated placements', () => {
  let placed = {};
  assert.equal(placeStoryCard(placed,0,0),placed);
  assert.equal(placeStoryCard(placed,-1,0),placed);
  assert.equal(placeStoryCard(placed,8,0),placed);
  assert.equal(placeStoryCard(placed,0.5,0),placed);
  for (let card = 0; card < STORY_DATA.length; card++) placed = placeStoryCard(placed,card,storyRange(STORY_DATA[card]));
  assert.equal(Object.keys(placed).length,8);
  assert.equal(Object.values(placed).filter(value => value === 1).length,4);
  assert.equal(placeStoryCard(placed,0,1),placed);
});
test('report completion requires both real-world questions and every independent table row', () => {
  assert.equal(checkStoryReport(STORY_DATA,['2','1'],false),true);
  for (const answers of [[],['','1'],['3','1'],['2','0']]) assert.equal(checkStoryReport(STORY_DATA,answers,false),false);
  assert.equal(checkStoryReport(OTHER_CLASS_DATA,['3','2','4','4','2'],true),true);
  for (const answers of [['2','4','2','4','2'],['3','2','','4','2'],['3','2','4','3','2'],['3','2','4','4','1']]) assert.equal(checkStoryReport(OTHER_CLASS_DATA,answers,true),false);
});
