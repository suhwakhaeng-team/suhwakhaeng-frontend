import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptsUTPreviewPassword, validUTNickname } from '../src/routes/dev/ut1EntryModel.ts';

test('로컬 입장 암호는 1234만 허용한다', () => {
  assert.equal(acceptsUTPreviewPassword('1234'), true);
  for (const value of ['', '123', '12345', '0000', ' 1234', '1234 ']) assert.equal(acceptsUTPreviewPassword(value), false);
});
test('닉네임은 공백을 제외한 1~40자를 허용한다', () => {
  for (const value of ['', '   ', '\n\t', '가'.repeat(41)]) assert.equal(validUTNickname(value), false);
  for (const value of ['수학이', '  수학이  ', '123', '가'.repeat(40)]) assert.equal(validUTNickname(value), true);
});
