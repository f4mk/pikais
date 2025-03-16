import { splitIntoChunks, parseCommandsIntoObject, parseCommands } from '../utils';
import {
  TOKENS_COMMAND,
  TEMP_COMMAND,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  MAX_ALLOWED_TOKENS,
  MAX_TEMPERATURE,
  MIN_ALLOWED_TOKENS,
  MIN_TEMPERATURE,
} from '../consts';

describe('splitIntoChunks', () => {
  it('should return empty array for empty input', () => {
    expect(splitIntoChunks('')).toEqual([]);
  });

  it('should not split text shorter than maxLength', () => {
    const text = 'Short text';
    expect(splitIntoChunks(text, 1500)).toEqual([text]);
  });

  it('should split text by newlines when possible', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    expect(splitIntoChunks(text, 10)).toEqual(['Line 1', 'Line 2', 'Line 3']);
  });

  it('should split long test when necessary', () => {
    const text = 'ThisIsAVery LongWord ThatShould BeSplit';
    expect(splitIntoChunks(text, 10)).toEqual(['ThisIsAVery', 'LongWord', 'ThatShould', 'BeSplit']);
  });

  it('should preserve formatting when possible', () => {
    const text = 'Short line\n\nAnother line with\nsome breaks';
    expect(splitIntoChunks(text, 1500)).toEqual([text]);
  });

  it('should keep long words intact', () => {
    const text = 'ThisIsAVeryLongWordThatShouldBeSplit';
    expect(splitIntoChunks(text, 10)).toEqual(['ThisIsAVeryLongWordThatShouldBeSplit']);
  });
});

describe('parseCommandsIntoObject', () => {
  it('should parse single command correctly', () => {
    const input = '!tokens=2000 Hello';
    const result = parseCommandsIntoObject(input);
    expect(result.commands).toEqual({ '!tokens': '2000' });
    expect(result.endCursor).toBe(13);
  });

  it('should parse multiple commands correctly', () => {
    const input = '!tokens=2000 !temp=1.5 Hello';
    const result = parseCommandsIntoObject(input);
    expect(result.commands).toEqual({ '!tokens': '2000', '!temp': '1.5' });
    expect(result.endCursor).toBe(23);
  });

  it('should stop at non-command content', () => {
    const input = '!tokens=2000 Hello !temp=1.5';
    const result = parseCommandsIntoObject(input);
    expect(result.commands).toEqual({ '!tokens': '2000' });
    expect(input.slice(result.endCursor).trim()).toBe('Hello !temp=1.5');
  });

  it('should handle empty input', () => {
    const result = parseCommandsIntoObject('');
    expect(result.commands).toEqual({});
    expect(result.endCursor).toBe(0);
  });
});

describe('parseCommands', () => {
  it('should parse commands with tokens first and temp second', () => {
    const input = '!tokens=2000 !temp=1.5 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: 2000,
      temperature: 1.5,
    });
  });

  it('should parse commands with temp first and tokens second', () => {
    const input = '!temp=1.5 !tokens=2000 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: 2000,
      temperature: 1.5,
    });
  });

  it('should parse when only tokens command is present', () => {
    const input = '!tokens=2000 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: 2000,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should parse when only temp command is present', () => {
    const input = '!temp=1.5 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: 1.5,
    });
  });

  it('should handle commands without spaces between them', () => {
    const input = '!temp=1.5!tokens=2000 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: 2000,
      temperature: 1.5,
    });
  });

  it('should not handle the first word without space after single command', () => {
    const input = '!tokens=2000Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: '',
      maxTokens: 2000,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should not handle the first word without space after multiple commands', () => {
    const input = '!tokens=2000!temp=1.5Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: '',
      maxTokens: 2000,
      temperature: 1.5,
    });
  });

  it('should handle the content starting from the second word without space after tokens command', () => {
    const input = '!tokens=2000Hello Another content';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Another content',
      maxTokens: 2000,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle the content starting from the second word without space after temp command', () => {
    const input = '!temp=1.87Hello Another content';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Another content',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: 1.87,
    });
  });

  it('should handle the content starting from the second word without space after multiple commands', () => {
    const input = '!tokens=2000!temp=1.5Hello Another content';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Another content',
      maxTokens: 2000,
      temperature: 1.5,
    });
  });

  it('should handle content without space after temp command', () => {
    const input = '!temp=1.5Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: '',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: 1.5,
    });
  });

  it('should use default values when commands are not present', () => {
    const result = parseCommands('Hello');
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should cap values at maximum limits', () => {
    const input = '!tokens=10000 !temp=3.0 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: MAX_ALLOWED_TOKENS,
      temperature: MAX_TEMPERATURE,
    });
  });

  it('should handle invalid values', () => {
    const input = '!tokens=invalid !temp=notanumber Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle mixed valid and invalid values', () => {
    const input = '!tokens=2000 !temp=notanumber Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: 2000,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle negative values', () => {
    const input = '!tokens=-100 !temp=-0.5 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: MIN_ALLOWED_TOKENS,
      temperature: MIN_TEMPERATURE,
    });
  });

  it('should handle negative tokens value', () => {
    const input = '!tokens=-100 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: MIN_ALLOWED_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle negative temperature value', () => {
    const input = '!temp=-0.5 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: MIN_TEMPERATURE,
    });
  });

  it('should accept minimum valid tokens value', () => {
    const input = '!tokens=1 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: MIN_ALLOWED_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should accept minimum valid temperature value', () => {
    const input = '!temp=0 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: MIN_TEMPERATURE,
    });
  });

  it('should handle temperature exactly at 0', () => {
    const input = '!temp=0 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: MIN_TEMPERATURE,
    });
  });

  it('should handle temperature exactly at 2', () => {
    const input = '!temp=2 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: MAX_TEMPERATURE,
    });
  });

  it('should handle decimal temperature values', () => {
    const input = '!temp=0.7 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: 0.7,
    });
  });

  it('should handle tokens exactly at 1', () => {
    const input = '!tokens=1 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: MIN_ALLOWED_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle tokens exactly at 8192', () => {
    const input = '!tokens=8192 Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: MAX_ALLOWED_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle invalid temperature values', () => {
    const input = '!temp=abc Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle invalid tokens values', () => {
    const input = '!tokens=xyz Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle content starting with spaces', () => {
    const input = '!tokens=2000   Hello';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: 'Hello',
      maxTokens: 2000,
      temperature: DEFAULT_TEMPERATURE,
    });
  });

  it('should handle empty content after commands', () => {
    const input = '!tokens=2000';
    const result = parseCommands(input);
    expect(result).toEqual({
      content: '',
      maxTokens: 2000,
      temperature: DEFAULT_TEMPERATURE,
    });
  });
});
