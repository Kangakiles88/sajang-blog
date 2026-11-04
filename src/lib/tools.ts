// 모든 계산기 목록: 직접 만든 계산기(site.config.ts의 TOOLS) + 명세로 만든 계산기(src/data/tools/*.json)
import { TOOLS } from '../site.config';

export interface SpecInput {
  key: string;
  label: string;
  type: 'money' | 'percent' | 'number' | 'select';
  help?: string;
  unit?: string;
  default?: number;
  options?: { label: string; value: number }[];
}
export interface ToolSpec {
  id: string;
  name: string;
  blurb: string;
  category: string;
  headline: string;
  description: string;
  inputs: SpecInput[];
  constants?: { key: string; value: number; label: string; source: string; evidence: string }[];
  steps: { key: string; expr: string }[];
  outputs: { key: string; label: string; format?: 'won' | 'percent' | 'number' | 'months'; primary?: boolean }[];
  notes?: { when: string; text: string }[];
  fine: string;
  method?: { heading: string; text: string }[];
  tests?: unknown[];
}

const specModules = import.meta.glob<{ default: ToolSpec }>('../data/tools/*.json', { eager: true });
export const SPEC_TOOLS: ToolSpec[] = Object.values(specModules)
  .map((m) => m.default)
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

export const ALL_TOOLS = [
  ...TOOLS.map((t) => ({ id: t.id as string, href: t.href, name: t.name, blurb: t.blurb, category: t.category as string })),
  ...SPEC_TOOLS.map((s) => ({ id: s.id, href: `/tools/${s.id}/`, name: s.name, blurb: s.blurb, category: s.category })),
];

export const getSpec = (id?: string) => SPEC_TOOLS.find((s) => s.id === id);
export const toolExists = (id: string) => ALL_TOOLS.some((t) => t.id === id);
