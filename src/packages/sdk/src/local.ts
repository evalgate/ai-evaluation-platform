/**
 * Local Development Mode (Tier 2.10)
 * Offline mode with local storage for development
 */

import fs from 'fs/promises'
import path from 'path'
import type { TraceData, EvaluationData, SpanData } from './types'

export interface LocalStorageOptions {
  directory?: string
  autoSave?: boolean
}

export class LocalStorage {
  private directory: string
  private autoSave: boolean
  private traces: Map<string, TraceData> = new Map()
  private evaluations: Map<string, EvaluationData> = new Map()
  private spans: Map<string, SpanData[]> = new Map()

  constructor(options: LocalStorageOptions = {}) {
    this.directory = options.directory || './.evalai-data'
    this.autoSave = options.autoSave !== false
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.directory, { recursive: true })
      await fs.mkdir(path.join(this.directory, 'traces'), { recursive: true })
      await fs.mkdir(path.join(this.directory, 'evaluations'), { recursive: true })
      await fs.mkdir(path.join(this.directory, 'spans'), { recursive: true })
      
      // Load existing data
      await this.loadAllData()
    } catch (error) {
      console.warn('Failed to initialize local storage:', error)
    }
  }

  private async loadAllData(): Promise<void> {
    try {
      // Load traces
      const tracesDir = path.join(this.directory, 'traces')
      const traceFiles = await fs.readdir(tracesDir)
      for (const file of traceFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(tracesDir, file), 'utf-8')
          const trace = JSON.parse(content) as TraceData
          this.traces.set(trace.id, trace)
        }
      }

      // Load evaluations
      const evalsDir = path.join(this.directory, 'evaluations')
      const evalFiles = await fs.readdir(evalsDir)
      for (const file of evalFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(evalsDir, file), 'utf-8')
          const evaluation = JSON.parse(content) as EvaluationData
          this.evaluations.set(evaluation.id, evaluation)
        }
      }
    } catch (error) {
      // Directories might not exist yet, that's fine
    }
  }

  async saveTrace(trace: TraceData): Promise<void> {
    this.traces.set(trace.id, trace)
    
    if (this.autoSave) {
      const filePath = path.join(this.directory, 'traces', `${trace.id}.json`)
      await fs.writeFile(filePath, JSON.stringify(trace, null, 2))
    }
  }

  async getTrace(id: string): Promise<TraceData | null> {
    return this.traces.get(id) || null
  }

  async listTraces(limit = 100): Promise<TraceData[]> {
    return Array.from(this.traces.values()).slice(0, limit)
  }

  async saveEvaluation(evaluation: EvaluationData): Promise<void> {
    this.evaluations.set(evaluation.id, evaluation)
    
    if (this.autoSave) {
      const filePath = path.join(this.directory, 'evaluations', `${evaluation.id}.json`)
      await fs.writeFile(filePath, JSON.stringify(evaluation, null, 2))
    }
  }

  async getEvaluation(id: string): Promise<EvaluationData | null> {
    return this.evaluations.get(id) || null
  }

  async listEvaluations(limit = 100): Promise<EvaluationData[]> {
    return Array.from(this.evaluations.values()).slice(0, limit)
  }

  async saveSpan(traceId: string, span: SpanData): Promise<void> {
    const existing = this.spans.get(traceId) || []
    existing.push(span)
    this.spans.set(traceId, existing)
    
    if (this.autoSave) {
      const filePath = path.join(this.directory, 'spans', `${traceId}.json`)
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2))
    }
  }

  async getSpans(traceId: string): Promise<SpanData[]> {
    return this.spans.get(traceId) || []
  }

  async clear(): Promise<void> {
    this.traces.clear()
    this.evaluations.clear()
    this.spans.clear()
    
    // Optionally delete files
    try {
      await fs.rm(this.directory, { recursive: true, force: true })
      await this.initialize()
    } catch (error) {
      console.warn('Failed to clear local storage:', error)
    }
  }

  async export(format: 'json'): Promise<string> {
    const data = {
      traces: Array.from(this.traces.values()),
      evaluations: Array.from(this.evaluations.values()),
      spans: Object.fromEntries(this.spans)
    }
    
    const exportPath = path.join(this.directory, `export-${Date.now()}.json`)
    await fs.writeFile(exportPath, JSON.stringify(data, null, 2))
    
    return exportPath
  }

  getStats() {
    return {
      traces: this.traces.size,
      evaluations: this.evaluations.size,
      totalSpans: Array.from(this.spans.values()).reduce((sum, spans) => sum + spans.length, 0)
    }
  }
}