<<<<<<< HEAD
import config from '@automattic/calypso-config';
import page from 'page';
import { ReactElement, useEffect } from 'react';
import { useSelector } from 'react-redux';
import JetpackLogo from 'calypso/components/jetpack-logo';
import SelectPartnerKey from 'calypso/jetpack-cloud/sections/partner-portal/primary/select-partner-key';
import {
	hasActivePartnerKey,
	hasFetchedPartner,
	isFetchingPartner,
	isAgencyUser,
} from 'calypso/state/partner-portal/partner/selectors';
=======
import { ReactElement } from 'react';
>>>>>>> 3f95993f20 (Update client code to check isAgencyUser in routing instead of rendering)
import SitesOverview from '../sites-overview';
import SitesOverviewContext from '../sites-overview/context';
import type { SitesOverviewContextInterface } from '../sites-overview/types';

import '../style.scss';

export default function DashboardOverview( {
	search,
	currentPage,
	filter,
}: SitesOverviewContextInterface ): ReactElement {
	const hasFetched = useSelector( hasFetchedPartner );
	const isFetching = useSelector( isFetchingPartner );
	const hasActiveKey = useSelector( hasActivePartnerKey );
	const isAgency = useSelector( isAgencyUser );
	const isAgencyEnabled = config.isEnabled( 'jetpack/agency-dashboard' );

	useEffect( () => {
		if ( hasFetched ) {
			if ( ! isAgency || ! isAgencyEnabled ) {
				page.redirect( '/' );
				return;
			}
		}
	}, [ hasFetched, isAgency, isAgencyEnabled ] );

	if ( hasFetched && ! hasActiveKey ) {
		return <SelectPartnerKey />;
	}

	if ( hasFetched ) {
		const context = {
			search,
			currentPage,
			filter,
		};
		return (
			<SitesOverviewContext.Provider value={ context }>
				<SitesOverview />
			</SitesOverviewContext.Provider>
		);
	}

	return (
		<SitesOverviewContext.Provider value={ context }>
			<SitesOverview />
		</SitesOverviewContext.Provider>
	);
}
