import { describe, it, expect } from 'vitest'
import {
  hydroStatusToJudgeStatus,
  LanguageMap,
  ReverseLanguageMap,
  HydroJudgeStatus,
} from '../types/judge.js'

describe('Judge Service - Type Mappings', () => {
  describe('hydroStatusToJudgeStatus', () => {
    it('should map WAITING to pending', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_WAITING)).toBe('pending')
    })

    it('should map FETCHED to pending', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_FETCHED)).toBe('pending')
    })

    it('should map JUDGING to judging', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_JUDGING)).toBe('judging')
    })

    it('should map COMPILING to judging', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_COMPILING)).toBe('judging')
    })

    it('should map ACCEPTED to accepted', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_ACCEPTED)).toBe('accepted')
    })

    it('should map WRONG_ANSWER to wrong_answer', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_WRONG_ANSWER)).toBe('wrong_answer')
    })

    it('should map TIME_LIMIT_EXCEEDED to time_limit_exceeded', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_TIME_LIMIT_EXCEEDED)).toBe('time_limit_exceeded')
    })

    it('should map MEMORY_LIMIT_EXCEEDED to memory_limit_exceeded', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_MEMORY_LIMIT_EXCEEDED)).toBe('memory_limit_exceeded')
    })

    it('should map OUTPUT_LIMIT_EXCEEDED to memory_limit_exceeded', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_OUTPUT_LIMIT_EXCEEDED)).toBe('memory_limit_exceeded')
    })

    it('should map RUNTIME_ERROR to runtime_error', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_RUNTIME_ERROR)).toBe('runtime_error')
    })

    it('should map COMPILE_ERROR to compile_error', () => {
      expect(hydroStatusToJudgeStatus(HydroJudgeStatus.STATUS_COMPILE_ERROR)).toBe('compile_error')
    })

    it('should map unknown status to runtime_error', () => {
      expect(hydroStatusToJudgeStatus(999)).toBe('runtime_error')
    })
  })

  describe('LanguageMap', () => {
    it('should map cpp to cc.cc17o2', () => {
      expect(LanguageMap.cpp).toBe('cc.cc17o2')
    })

    it('should map python to py.py3', () => {
      expect(LanguageMap.python).toBe('py.py3')
    })

    it('should map java to java', () => {
      expect(LanguageMap.java).toBe('java')
    })

    it('should map javascript to js.node', () => {
      expect(LanguageMap.javascript).toBe('js.node')
    })

    it('should map go to go', () => {
      expect(LanguageMap.go).toBe('go')
    })
  })

  describe('ReverseLanguageMap', () => {
    it('should map cc.cc17o2 to cpp', () => {
      expect(ReverseLanguageMap['cc.cc17o2']).toBe('cpp')
    })

    it('should map py.py3 to python', () => {
      expect(ReverseLanguageMap['py.py3']).toBe('python')
    })

    it('should map java to java', () => {
      expect(ReverseLanguageMap['java']).toBe('java')
    })

    it('should map js.node to javascript', () => {
      expect(ReverseLanguageMap['js.node']).toBe('javascript')
    })

    it('should map go to go', () => {
      expect(ReverseLanguageMap['go']).toBe('go')
    })
  })

  describe('Language mapping consistency', () => {
    it('should have consistent forward and reverse mappings', () => {
      for (const [lang, hydroLang] of Object.entries(LanguageMap)) {
        expect(ReverseLanguageMap[hydroLang]).toBe(lang)
      }
    })
  })
})

describe('Judge Service - HydroJudgeStatus constants', () => {
  it('should have correct status values', () => {
    expect(HydroJudgeStatus.STATUS_WAITING).toBe(0)
    expect(HydroJudgeStatus.STATUS_ACCEPTED).toBe(1)
    expect(HydroJudgeStatus.STATUS_WRONG_ANSWER).toBe(2)
    expect(HydroJudgeStatus.STATUS_TIME_LIMIT_EXCEEDED).toBe(3)
    expect(HydroJudgeStatus.STATUS_MEMORY_LIMIT_EXCEEDED).toBe(4)
    expect(HydroJudgeStatus.STATUS_OUTPUT_LIMIT_EXCEEDED).toBe(5)
    expect(HydroJudgeStatus.STATUS_RUNTIME_ERROR).toBe(6)
    expect(HydroJudgeStatus.STATUS_COMPILE_ERROR).toBe(7)
    expect(HydroJudgeStatus.STATUS_SYSTEM_ERROR).toBe(8)
    expect(HydroJudgeStatus.STATUS_CANCELED).toBe(9)
    expect(HydroJudgeStatus.STATUS_ETC).toBe(10)
    expect(HydroJudgeStatus.STATUS_JUDGING).toBe(20)
    expect(HydroJudgeStatus.STATUS_COMPILING).toBe(21)
    expect(HydroJudgeStatus.STATUS_FETCHED).toBe(22)
  })
})
