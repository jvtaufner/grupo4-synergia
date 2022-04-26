import React, {useEffect, useState} from 'react';
import SimpleLabelView from '/imports/ui/components/SimpleLabelView/SimpleLabelView';
import {hasValue} from '/imports/libs/hasValue';
import * as appStyle from '/imports/materialui/styles';
import TextField from '@mui/material/TextField';
import InputBase from '@mui/material/InputBase';

let timeoutOnChange;

export default ({name, label, value, onChange, readOnly, error, ...otherProps}: IBaseSimpleFormComponent) => {
    if (readOnly) {
        return (<div key={name} style={{display: 'flex', flexDirection: 'column'}}>
            <SimpleLabelView label={label}/>
            <TextField
                variant={'outlined'} key={name} value={value?value.toLocaleDateString():undefined} error={!!error} disabled={!!readOnly} id={name}
                name={name} {...otherProps} label={null}
            />
        </div>);
    }
    const [dateValue, setDateValue] = useState(hasValue(value) ? new Date(value) : undefined);

    useEffect(() => {
        if (hasValue(value) && value !== dateValue) {
            setDateValue(hasValue(value) ? new Date(value) : new Date());
        }
    }, [value]);

    if (otherProps.isNaked) {
        return (<InputBase
            key={name} onChange={onChange} value={value} error={!!error} disabled={!!readOnly} id={name}
            name={name} label={otherProps.labelDisable ? undefined : label} {...otherProps}
        />);
    }

    const handleChange = (evt) => {
        timeoutOnChange&&clearTimeout(timeoutOnChange);
        if(!evt.target.value){
            onChange({name, target: {name, value: null}});
            setDateValue(evt.target.value);
            return;
        }

        timeoutOnChange = setTimeout(()=>{
            try {
                if(evt.target.value === ''){
                    onChange({name, target: {name, value: evt.target.value}});
                }
                const date = new Date(evt.target.value)
                if(!isNaN(date.getTime())) {
                    date.setHours(date.getHours() + 10);
                    onChange({name, target: {name, value: date}});
                }
            } catch (e) {
                console.log('Data Inválida',e);
            }
        },1000);

        setDateValue(evt.target.value);

    };

    const onBlur = () => {
        if(new Date(dateValue) !== new Date(value)) {
            try {
                const date = new Date(dateValue)
                if(!isNaN(date.getTime())) {
                    date.setHours(date.getHours() + 10);
                    onChange({name, target: {name, value: date}});
                }
            } catch (e) {
                console.log('Data Inválida',e);
            }
        }

    }

    return (<div key={name} style={{display: 'flex', flexDirection: 'column', ...appStyle.fieldContainer}}>
        <SimpleLabelView label={label}/>
        <TextField
            variant={'outlined'}
            key={name}
            onChange={handleChange}
            onBlur={onBlur}
            value={dateValue && dateValue instanceof Date ? dateValue.toISOString().split('T')[0] : dateValue }
            //value={dateValue}

            error={!!error}
            disabled={!!readOnly}
            id={name}
            name={name}
            label={null}
            type="date"
            inputProps={{
                max: '9999-12-31'
            }}
            InputLabelProps={{
                shrink: true,
            }}
            {...otherProps}
        />
    </div>);
};
