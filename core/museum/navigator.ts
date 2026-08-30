import type { MuseumDestination } from './destination'
import type { ExhibitRegistry } from './registry'

export class MuseumNavigator {
  constructor(
    private readonly registry: ExhibitRegistry,
    private readonly onSettle: (destination: MuseumDestination) => void,
  ) {}

  async navigate(destination: MuseumDestination): Promise<void> {
    if (destination.kind === 'desk') {
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

    await exhibit.preload(destination.target)
    await exhibit.activate(destination.target)

    if (destination.target !== undefined) {
      await exhibit.navigate(destination.target)
    }

    this.onSettle(destination)
  }
}
