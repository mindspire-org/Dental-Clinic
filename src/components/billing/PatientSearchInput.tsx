import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { patientsApi } from '@/lib/api';

interface Patient {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
}

interface PatientSearchInputProps {
    value: string;
    onValueChange: (patientId: string, patient: Patient | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function PatientSearchInput({ value, onValueChange, placeholder = 'Search patient...', disabled = false }: PatientSearchInputProps) {
    const [open, setOpen] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (search?: string) => {
        try {
            setLoading(true);
            const params: any = { page: 1, limit: 50 };
            if (search) params.search = search;

            const response = await patientsApi.getAll(params);
            setPatients(response?.data?.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            fetchPatients(query);
        } else if (query.length === 0) {
            fetchPatients();
        }
    };

    const selectedPatient = patients.find(p => p._id === value);

    const getPatientDisplay = (patient: Patient) => {
        const name = `${patient.firstName} ${patient.lastName}`.trim();
        const phone = patient.phone ? ` • ${patient.phone}` : '';
        return `${name}${phone}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedPatient ? (
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{getPatientDisplay(selectedPatient)}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search by name, phone, or ID..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                    />
                    <CommandList>
                        {loading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading patients...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>No patients found.</CommandEmpty>
                                <CommandGroup>
                                    {patients.map((patient) => (
                                        <CommandItem
                                            key={patient._id}
                                            value={patient._id}
                                            onSelect={() => {
                                                onValueChange(patient._id, patient);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    value === patient._id ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {patient.firstName} {patient.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {patient.phone && `📞 ${patient.phone}`}
                                                    {patient.email && ` • ✉ ${patient.email}`}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
