import type { MuseumExhibit } from './exhibit'

export class ExhibitRegistry {
  private readonly exhibits = new Map<string, MuseumExhibit>()

  register(exhibit: MuseumExhibit): void {
    if (this.exhibits.has(exhibit.id)) {
      throw new Error(`Exhibit already registered: ${exhibit.id}`)
    }

    this.exhibits.set(exhibit.id, exhibit)
  }

  get(id: string): MuseumExhibit | undefined {
    return this.exhibits.get(id)
  }

  has(id: string): boolean {
    return this.exhibits.has(id)
  }
}
