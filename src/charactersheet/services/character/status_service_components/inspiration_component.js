import {
    CharacterManager,
    Notifications
} from 'charactersheet/utilities';
import { KeyValuePredicate } from 'charactersheet/services/common/persistence_service_components/persistence_service_predicates';
import { OtherStats } from 'charactersheet/models/character/other_stats';
import { PersistenceService } from 'charactersheet/services/common/persistence_service';
import { SharedServiceManager } from 'charactersheet/services/common/shared_service_manager';
import { Status } from 'charactersheet/models/common/status';
import { StatusWeightPair } from 'charactersheet/models/common/status_weight_pair';

/**
 * A Status Service Component that tracks the total weight that a character
 * is carrying, and any modifiers that are applied due to this weight.
 */
export function InspirationStatusServiceComponent() {
    var self = this;

    self.statusIdentifier = 'Status.Inspired';

    self.init = function() {
        Notifications.otherStats.inspiration.changed.add(self.dataHasChanged);
        self.dataHasChanged();  //Calculate the first one.
    };

    /**
     * This method generates and persists a status that reflects
     * the character's encumbrance.
     */
    self.dataHasChanged = function() {
        var key = CharacterManager.activeCharacter().key();
        var stats = PersistenceService.findFirstBy(OtherStats, 'characterId', key);

        if (!stats) { return; }

        if (stats) {
            if (!parseInt(stats.inspiration())) {
                self._removeStatus();
            } else {
                self._updateStatus();
            }
        }
    };

    /* Private Methods */

    self._updateStatus = function() {
        var key = CharacterManager.activeCharacter().key();

        var status = PersistenceService.findByPredicates(Status,
            [new KeyValuePredicate('characterId', key),
            new KeyValuePredicate('identifier', self.statusIdentifier)])[0];
        if (!status) {
            status = new Status();
            status.characterId(key);
            status.identifier(self.statusIdentifier);
        }

        status.name('inspired');
        status.type('info');
        status.value(1);

        status.save();
        Notifications.status.changed.dispatch();
    };

    self._removeStatus = function() {
        var key = CharacterManager.activeCharacter().key();
        var status = PersistenceService.findByPredicates(Status,
            [new KeyValuePredicate('characterId', key),
            new KeyValuePredicate('identifier', self.statusIdentifier)])[0];
        if (status) {
            status.delete();
            Notifications.status.changed.dispatch();
        }
    };
}
