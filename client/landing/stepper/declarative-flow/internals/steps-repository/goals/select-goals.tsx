import { Button } from '@automattic/components';
import { Onboard } from '@automattic/data-stores';
import { useTranslate } from 'i18n-calypso';
import DIFMLink from './difm-link';
import { useGoals } from './goals';
import ImportLink from './import-link';
import SelectCard from './select-card';

type SelectGoalsProps = {
	displayAllGoals: boolean;
	onChange: ( selectedGoals: Onboard.SiteGoal[] ) => void;
	onSubmit: ( selectedGoals: Onboard.SiteGoal[] ) => void;
	selectedGoals: Onboard.SiteGoal[];
};

const SiteGoal = Onboard.SiteGoal;

export const SelectGoals = ( {
	displayAllGoals,
	onChange,
	onSubmit,
	selectedGoals,
}: SelectGoalsProps ) => {
	const translate = useTranslate();
	const goalOptions = useGoals( displayAllGoals );

	const addGoal = ( goal: Onboard.SiteGoal ) => {
		const goalSet = new Set( selectedGoals );
		goalSet.add( goal );
		return Array.from( goalSet );
	};

	const removeGoal = ( goal: Onboard.SiteGoal ) => {
		const goalSet = new Set( selectedGoals );
		goalSet.delete( goal );
		return Array.from( goalSet );
	};

	const handleChange = ( selected: boolean, goal: Onboard.SiteGoal ) => {
		const newSelectedGoals = selected ? addGoal( goal ) : removeGoal( goal );
		onChange( newSelectedGoals );
	};

	const handleContinueButtonClick = () => {
		onSubmit( selectedGoals );
	};

	const handleImportLinkClick = () => {
		const selectedGoalsWithImport = addGoal( SiteGoal.Import );
		onSubmit( selectedGoalsWithImport );
	};

	const handleDIFMLinkClick = () => {
		const selectedGoalsWithDIFM = addGoal( SiteGoal.DIFM );
		onSubmit( selectedGoalsWithDIFM );
	};

	return (
		<>
			{ displayAllGoals && (
				<div className="select-goals__cards-hint">{ translate( 'Select all that apply' ) }</div>
			) }

			<div className="select-goals__cards-container">
				{ goalOptions.map( ( { key, title, isPremium } ) => (
					<SelectCard
						key={ key }
						onChange={ handleChange }
						selected={ selectedGoals.includes( key ) }
						value={ key }
					>
						<span className="select-goals__goal-title">{ title }</span>
						{ isPremium && (
							<span className="select-goals__premium-badge">{ translate( 'Premium' ) }</span>
						) }
					</SelectCard>
				) ) }
			</div>

			<div className="select-goals__actions-container">
				<Button primary onClick={ handleContinueButtonClick }>
					{ translate( 'Continue' ) }
				</Button>
			</div>

			{ ! displayAllGoals && (
				<div className="select-goals__links-container">
					<ImportLink onClick={ handleImportLinkClick } />
					<DIFMLink onClick={ handleDIFMLinkClick } />
				</div>
			) }
		</>
	);
};

export default SelectGoals;
