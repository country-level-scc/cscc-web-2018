// @flow
import * as React from 'react';
import matchSorter from 'match-sorter';
import clamp from 'lodash/clamp';

export class CountryNamePicker extends React.Component<> {
  state = {
    country: 'WLD',
    inputValue: '',
    focused: -2,
  };

  componentDidUpdate(prevProps) {
    if (prevProps.country !== this.props.country) {
      const possibleRow = countries.find(row => row.id === this.props.country);
      if (possibleRow) {
        this.setState({
          country: possibleRow.id,
          inputValue: possibleRow.label,
        })
      }
    }
  }

  render() {
    const filteredCountries =
      this.state.inputValue.trim() === ''
        ? countries
        : matchSorter(countries, this.state.inputValue, {keys: ['label']});
    return (
      <div
        className="country-picker"
        onMouseDownCapture={evt => {
          if (this.state.dropdownOpen) evt.preventDefault();
        }}
      >
        <input
          type="text"
          className="country-picker-input"
          value={this.state.inputValue}
          onChange={evt => this.setState({inputValue: evt.currentTarget.value})}
          onFocus={() => {
            this.setState({dropdownOpen: true});
          }}
          onClick={() => this.setState({dropdownOpen: true, focused: 0})}
          onBlur={() => {
            this.setState({dropdownOpen: false, focused: -1});
          }}
          placeholder="Pick a country"
          onKeyDown={this.handleKeyPress(filteredCountries)}
        />
        {this.state.dropdownOpen && (
          <div
            className="country-picker-countries"
            ref={el => (this.scrollParent = el)}
          >
            {filteredCountries.map(({id, label}, idx) => (
              <div
                className={
                  idx === this.state.focused
                    ? 'country-picker-country country-picker-country-selected'
                    : 'country-picker-country'
                }
                ref={el => {
                  if (idx === this.state.focused) {
                    this.selectedCountry = el;
                  }
                }}
                key={id}
                onClick={() => {
                  if (this.props.onChange) {
                    this.props.onChange({id, label});
                  }
                  this.setState({
                    inputValue: label,
                    dropdownOpen: false,
                    focused: -1,
                  });
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  handleKeyPress = countryList => evt => {
    const focusClamp = num => clamp(num, 0, countryList.length);
    switch (evt.key) {
      case 'ArrowDown':
        this.setState(
          ({focused}) => ({
            focused: focusClamp(focused + 1),
            dropdownOpen: true,
          }),
          () => {
            this.selectedCountry &&
              this.selectedCountry.scrollIntoViewIfNeeded();
          },
        );
        evt.preventDefault();
        return;
      case 'ArrowUp':
        this.setState(
          ({focused}) => {
            if (focused === 0) {
              return {dropdownOpen: false, focused: -1};
            } else {
              return {focused: focusClamp(focused - 1)};
            }
          },
          () => {
            this.selectedCountry &&
              this.selectedCountry.scrollIntoViewIfNeeded();
          },
        );
        evt.preventDefault();
        return;
      case 'Enter':
        this.setState({
          inputValue: countryList[focusClamp(this.state.focused)].label,
          country: countryList[focusClamp(this.state.focused)].id,
          focused: 0,
          dropdownOpen: false,
        });
        this.props.onChange &&
          this.props.onChange(countryList[focusClamp(this.state.focused)]);
        return;
      case 'Escape':
        this.setState({dropdownOpen: false});
        return;
      default:
        return this.setState({dropdownOpen: true, focused: -1});
    }
  };
}

const countries = [
  {id: 'WLD', label: 'World'},
  {id: 'AFG', label: 'Afghanistan'},
  {id: 'ALB', label: 'Albania'},
  {id: 'DZA', label: 'Algeria'},
  {id: 'AGO', label: 'Angola'},
  {id: 'ARG', label: 'Argentina'},
  {id: 'ARM', label: 'Armenia'},
  {id: 'AUS', label: 'Australia'},
  {id: 'AUT', label: 'Austria'},
  {id: 'AZE', label: 'Azerbaijan'},
  {id: 'BHS', label: 'Bahamas'},
  {id: 'BGD', label: 'Bangladesh'},
  {id: 'BLR', label: 'Belarus'},
  {id: 'BEL', label: 'Belgium'},
  {id: 'BLZ', label: 'Belize'},
  {id: 'BEN', label: 'Benin'},
  {id: 'BTN', label: 'Bhutan'},
  {id: 'BOL', label: 'Bolivia'},
  {id: 'BIH', label: 'Bosnia and Herz.'},
  {id: 'BWA', label: 'Botswana'},
  {id: 'BRA', label: 'Brazil'},
  {id: 'BRN', label: 'Brunei'},
  {id: 'BGR', label: 'Bulgaria'},
  {id: 'BFA', label: 'Burkina Faso'},
  {id: 'BDI', label: 'Burundi'},
  {id: 'KHM', label: 'Cambodia'},
  {id: 'CMR', label: 'Cameroon'},
  {id: 'CAN', label: 'Canada'},
  {id: 'CAF', label: 'Central African Rep.'},
  {id: 'TCD', label: 'Chad'},
  {id: 'CHL', label: 'Chile'},
  {id: 'CHN', label: 'China'},
  {id: 'COL', label: 'Colombia'},
  {id: 'COG', label: 'Congo'},
  {id: 'CRI', label: 'Costa Rica'},
  {id: 'CIV', label: "Cóte d'Ivoire"},
  {id: 'HRV', label: 'Croatia'},
  {id: 'CUB', label: 'Cuba'},
  {id: 'CZE', label: 'Czechia'},
  {id: 'COD', label: 'Dem. Rep. Congo'},
  {id: 'DNK', label: 'Denmark'},
  {id: 'DJI', label: 'Djibouti'},
  {id: 'DOM', label: 'Dominican Rep.'},
  {id: 'ECU', label: 'Ecuador'},
  {id: 'EGY', label: 'Egypt'},
  {id: 'SLV', label: 'El Salvador'},
  {id: 'GNQ', label: 'Eq. Guinea'},
  {id: 'ERI', label: 'Eritrea'},
  {id: 'EST', label: 'Estonia'},
  {id: 'SWZ', label: 'eSwatini'},
  {id: 'ETH', label: 'Ethiopia'},
  {id: 'FJI', label: 'Fiji'},
  {id: 'FIN', label: 'Finland'},
  {id: 'FRA', label: 'France'},
  {id: 'GAB', label: 'Gabon'},
  {id: 'GMB', label: 'Gambia'},
  {id: 'GEO', label: 'Georgia'},
  {id: 'DEU', label: 'Germany'},
  {id: 'GHA', label: 'Ghana'},
  {id: 'GRC', label: 'Greece'},
  {id: 'GTM', label: 'Guatemala'},
  {id: 'GIN', label: 'Guinea'},
  {id: 'GNB', label: 'Guinea-Bissau'},
  {id: 'GUY', label: 'Guyana'},
  {id: 'HTI', label: 'Haiti'},
  {id: 'HND', label: 'Honduras'},
  {id: 'HUN', label: 'Hungary'},
  {id: 'ISL', label: 'Iceland'},
  {id: 'IND', label: 'India'},
  {id: 'IDN', label: 'Indonesia'},
  {id: 'IRN', label: 'Iran'},
  {id: 'IRQ', label: 'Iraq'},
  {id: 'IRL', label: 'Ireland'},
  {id: 'ISR', label: 'Israel'},
  {id: 'ITA', label: 'Italy'},
  {id: 'JAM', label: 'Jamaica'},
  {id: 'JPN', label: 'Japan'},
  {id: 'JOR', label: 'Jordan'},
  {id: 'KAZ', label: 'Kazakhstan'},
  {id: 'KEN', label: 'Kenya'},
  {id: 'KWT', label: 'Kuwait'},
  {id: 'KGZ', label: 'Kyrgyzstan'},
  {id: 'LAO', label: 'Laos'},
  {id: 'LVA', label: 'Latvia'},
  {id: 'LBN', label: 'Lebanon'},
  {id: 'LSO', label: 'Lesotho'},
  {id: 'LBR', label: 'Liberia'},
  {id: 'LBY', label: 'Libya'},
  {id: 'LTU', label: 'Lithuania'},
  {id: 'LUX', label: 'Luxembourg'},
  {id: 'MKD', label: 'Macedonia'},
  {id: 'MDG', label: 'Madagascar'},
  {id: 'MWI', label: 'Malawi'},
  {id: 'MYS', label: 'Malaysia'},
  {id: 'MLI', label: 'Mali'},
  {id: 'MRT', label: 'Mauritania'},
  {id: 'MEX', label: 'Mexico'},
  {id: 'MDA', label: 'Moldova'},
  {id: 'MNG', label: 'Mongolia'},
  {id: 'MNE', label: 'Montenegro'},
  {id: 'MAR', label: 'Morocco'},
  {id: 'MOZ', label: 'Mozambique'},
  {id: 'MMR', label: 'Myanmar'},
  {id: 'CYP', label: 'N. Cyprus'},
  {id: 'NAM', label: 'Namibia'},
  {id: 'NPL', label: 'Nepal'},
  {id: 'NLD', label: 'Netherlands'},
  {id: 'NCL', label: 'New Caledonia'},
  {id: 'NZL', label: 'New Zealand'},
  {id: 'NIC', label: 'Nicaragua'},
  {id: 'NER', label: 'Niger'},
  {id: 'NGA', label: 'Nigeria'},
  {id: 'NOR', label: 'Norway'},
  {id: 'OMN', label: 'Oman'},
  {id: 'PAK', label: 'Pakistan'},
  {id: 'PAN', label: 'Panama'},
  {id: 'PNG', label: 'Papua New Guinea'},
  {id: 'PRY', label: 'Paraguay'},
  {id: 'PER', label: 'Peru'},
  {id: 'PHL', label: 'Philippines'},
  {id: 'POL', label: 'Poland'},
  {id: 'PRT', label: 'Portugal'},
  {id: 'QAT', label: 'Qatar'},
  {id: 'ROU', label: 'Romania'},
  {id: 'RUS', label: 'Russia'},
  {id: 'RWA', label: 'Rwanda'},
  {id: 'SAU', label: 'Saudi Arabia'},
  {id: 'SEN', label: 'Senegal'},
  {id: 'SRB', label: 'Serbia'},
  {id: 'SLE', label: 'Sierra Leone'},
  {id: 'SVK', label: 'Slovakia'},
  {id: 'SVN', label: 'Slovenia'},
  {id: 'SLB', label: 'Solomon Is.'},
  {id: 'SOM', label: 'Somalia'},
  {id: 'ZAF', label: 'South Africa'},
  {id: 'KOR', label: 'South Korea'},
  {id: 'ESP', label: 'Spain'},
  {id: 'LKA', label: 'Sri Lanka'},
  {id: 'SDN', label: 'Sudan'},
  {id: 'SUR', label: 'Suriname'},
  {id: 'SWE', label: 'Sweden'},
  {id: 'CHE', label: 'Switzerland'},
  {id: 'SYR', label: 'Syria'},
  {id: 'TJK', label: 'Tajikistan'},
  {id: 'TZA', label: 'Tanzania'},
  {id: 'THA', label: 'Thailand'},
  {id: 'TGO', label: 'Togo'},
  {id: 'TTO', label: 'Trinidad and Tobago'},
  {id: 'TUN', label: 'Tunisia'},
  {id: 'TUR', label: 'Turkey'},
  {id: 'TKM', label: 'Turkmenistan'},
  {id: 'UGA', label: 'Uganda'},
  {id: 'UKR', label: 'Ukraine'},
  {id: 'ARE', label: 'United Arab Emirates'},
  {id: 'GBR', label: 'United Kingdom'},
  {id: 'USA', label: 'United States of America'},
  {id: 'URY', label: 'Uruguay'},
  {id: 'UZB', label: 'Uzbekistan'},
  {id: 'VUT', label: 'Vanuatu'},
  {id: 'VEN', label: 'Venezuela'},
  {id: 'VNM', label: 'Vietnam'},
  {id: 'YEM', label: 'Yemen'},
  {id: 'ZMB', label: 'Zambia'},
  {id: 'ZWE', label: 'Zimbabwe'},
];
