import type { MuseumDestination } from './destination'
import type { ExhibitRegistry } from './registry'

export class MuseumNavigator {
  private activeExhibitId: string | null = null

  constructor(
    private readonly registry: ExhibitRegistry,
    private readonly onSettle: (destination: MuseumDestination) => void,
  ) {}

  async navigate(destination: MuseumDestination): Promise<void> {
    if (destination.kind === 'desk') {
      await this.suspendActiveExhibit()
      this.onSettle(destination)
      return
    }

    const exhibit = this.registry.get(destination.exhibit)

    if (!exhibit) {
      throw new Error(`No exhibit registered for destination: ${destination.exhibit}`)
    }

    if (!exhibit.canPresent(destination.target)) {
      throw new Error(`Exhibit ${destination.exhibit} cannot present the requested target`)
    }

    if (this.activeExhibitId && this.activeExhibitId !== destination.exhibit) {
      await this.suspendActiveExhibit()
    }

    await exhibit.preload(destination.target)
    await exhibit.activate(destination.target)

    if (destination.target !== undefined) {
      await exhibit.navigate(destination.target)
    }

    this.activeExhibitId = destination.exhibit
    this.onSettle(destination)
  }

  private async suspendActiveExhibit(): Promise<void> {
    if (!this.activeExhibitId) {
      return
    }

    const active = this.registry.get(this.activeExhibitId)
    if (active) {
      await active.suspend()
    }

    this.activeExhibitId = null
  }
}
