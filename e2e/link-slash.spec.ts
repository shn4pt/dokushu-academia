import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { slashPath } from '../src/ui/slash'

// アプリ内リンクの末尾スラッシュ(パスの URL 版。Issue #19)の、移動先の変換(ブラウザなしの検査)と、共通部品の使用の検査。

test('slashPath: パスの末尾にだけ、スラッシュを足す。search と hash は、そのまま', () => {
  expect(slashPath('/lesson/pm-1')).toBe('/lesson/pm-1/')
  expect(slashPath('/lesson/pm-1/')).toBe('/lesson/pm-1/')
  expect(slashPath('/search?q=PM')).toBe('/search/?q=PM')
  expect(slashPath('/search?q=a/b')).toBe('/search/?q=a/b')
  expect(slashPath('/lesson/pm-1#top')).toBe('/lesson/pm-1/#top')
  expect(slashPath('/lesson/pm-1?x=1#top')).toBe('/lesson/pm-1/?x=1#top')
  expect(slashPath('/')).toBe('/')
  expect(slashPath('/?a=1')).toBe('/?a=1')
  expect(slashPath('?q=1')).toBe('?q=1') // 相対は、そのまま
  expect(slashPath('lesson/pm-1')).toBe('lesson/pm-1')
  expect(slashPath('//example.com/x')).toBe('//example.com/x') // 外部ホスト形式は触らない
  expect(slashPath({ pathname: '/lesson/pm-1', search: '?a=1', hash: '#h' })).toEqual({ pathname: '/lesson/pm-1/', search: '?a=1', hash: '#h' })
  expect(slashPath({ search: '?a=1' })).toEqual({ search: '?a=1' })
})

test('アプリ内リンクは、共通部品(src/ui/Link)から読み込む。react-router-dom から直接 Link / NavLink を読み込まない', () => {
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.tsx?$/.test(name) && p !== join('src', 'ui', 'Link.tsx')) {
        const m = [...readFileSync(p, 'utf8').matchAll(/import\s*\{([^}]*)\}\s*from\s*'react-router-dom'/g)]
        if (m.some((x) => x[1].split(',').some((n) => ['Link', 'NavLink'].includes(n.trim())))) offenders.push(p)
      }
    }
  }
  walk('src')
  expect(offenders).toEqual([])
})
