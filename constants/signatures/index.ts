import { ChemicalSignature } from '../../types';
import { ANCHORS_AND_CONTROLS } from './anchors';
import { CUTTING_AGENTS } from './cuttingAgents';
import { OPIOIDS } from './opioids';
import { FENTANYLS_AND_ZENE } from './fentanyls';
import { BENZODIAZEPINES } from './benzos';
import { STIMULANTS } from './stimulants';
import { PSYCHEDELICS } from './psychedelics';
import { DISSOCIATIVES } from './dissociatives';
import { SYNTHETIC_CANNABINOIDS } from './cannabinoids';
import { MATRIX_CONTAMINANTS } from './contaminants';
import { CHEMICAL_HAZARDS } from './hazards';

export const ALPHA_LIBRARY: ChemicalSignature[] = [
  ...ANCHORS_AND_CONTROLS,
  ...CUTTING_AGENTS,
  ...OPIOIDS,
  ...FENTANYLS_AND_ZENE,
  ...BENZODIAZEPINES,
  ...STIMULANTS,
  ...PSYCHEDELICS,
  ...DISSOCIATIVES,
  ...SYNTHETIC_CANNABINOIDS,
  ...MATRIX_CONTAMINANTS,
  ...CHEMICAL_HAZARDS
];

export {
    ANCHORS_AND_CONTROLS,
    CUTTING_AGENTS,
    OPIOIDS,
    FENTANYLS_AND_ZENE,
    BENZODIAZEPINES,
    STIMULANTS,
    PSYCHEDELICS,
    DISSOCIATIVES,
    SYNTHETIC_CANNABINOIDS,
    MATRIX_CONTAMINANTS,
    CHEMICAL_HAZARDS
};